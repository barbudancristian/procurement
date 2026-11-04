using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Win32;

namespace SourcingHub.Desktop;

/// <summary>
/// Connection settings, read in this order (later wins):
/// 1. config.json next to the app, 2. HKLM\SOFTWARE\Sourcing Hub (set by the MSI or
/// Group Policy), 3. C:\ProgramData\Sourcing Hub\config.json, 4. the site an
/// administrator chose in the app, saved for the current Windows user only.
/// </summary>
public sealed class AppConfig
{
    [JsonPropertyName("tenantId")] public string TenantId { get; set; } = "";
    [JsonPropertyName("clientId")] public string ClientId { get; set; } = "";
    [JsonPropertyName("siteUrl")] public string? SiteUrl { get; set; }

    /// <summary>"demo" starts the app on its demo database for every user of this computer.</summary>
    [JsonPropertyName("mode")] public string? Mode { get; set; }

    [JsonIgnore] public bool Demo => string.Equals(Mode, "demo", StringComparison.OrdinalIgnoreCase);

    [JsonIgnore] public string? SiteUrlSource { get; set; }

    public static string MachineFile => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Sourcing Hub", "config.json");

    public static string InstallFile => Path.Combine(AppContext.BaseDirectory, "config.json");

    public static string UserFolder => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Sourcing Hub");

    static string UserFile => Path.Combine(UserFolder, "user.json");

    static readonly JsonSerializerOptions Json = new() { WriteIndented = true };

    public bool IsValid(out string problem)
    {
        if (!Guid.TryParse(TenantId, out var t) || t == Guid.Empty)
            problem = "The tenant ID is missing.";
        else if (!Guid.TryParse(ClientId, out var c) || c == Guid.Empty)
            problem = "The app registration (client) ID is missing.";
        else
            problem = "";
        return problem.Length == 0;
    }

    public static AppConfig Load()
    {
        var config = new AppConfig();
        foreach (var layer in new[] { Read(InstallFile), ReadRegistry(), Read(MachineFile) })
        {
            if (layer is null) continue;
            if (!string.IsNullOrWhiteSpace(layer.TenantId)) config.TenantId = layer.TenantId.Trim();
            if (!string.IsNullOrWhiteSpace(layer.ClientId)) config.ClientId = layer.ClientId.Trim();
            if (!string.IsNullOrWhiteSpace(layer.SiteUrl)) config.SiteUrl = layer.SiteUrl.Trim();
            if (!string.IsNullOrWhiteSpace(layer.Mode)) config.Mode = layer.Mode.Trim();
        }
        if (!string.IsNullOrWhiteSpace(config.SiteUrl)) config.SiteUrlSource = "machine";
        var user = Read(UserFile);
        if (!string.IsNullOrWhiteSpace(user?.SiteUrl))
        {
            config.SiteUrl = user!.SiteUrl;
            config.SiteUrlSource = "user";
        }
        return config;
    }

    public void SaveUserSiteUrl(string siteUrl)
    {
        if (!Uri.TryCreate(siteUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps ||
            !uri.Host.EndsWith(".sharepoint.com", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("The address must be an https SharePoint Online site.");
        Directory.CreateDirectory(UserFolder);
        File.WriteAllText(UserFile, JsonSerializer.Serialize(new AppConfig { SiteUrl = siteUrl }, Json));
        SiteUrl = siteUrl;
        SiteUrlSource = "user";
    }

    static AppConfig? ReadRegistry()
    {
        using var key = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64).OpenSubKey(@"SOFTWARE\Sourcing Hub");
        if (key is null) return null;
        return new AppConfig
        {
            TenantId = key.GetValue("TenantId") as string ?? "",
            ClientId = key.GetValue("ClientId") as string ?? "",
            SiteUrl = key.GetValue("SiteUrl") as string,
        };
    }

    static AppConfig? Read(string path)
    {
        try
        {
            return File.Exists(path) ? JsonSerializer.Deserialize<AppConfig>(File.ReadAllText(path)) : null;
        }
        catch (Exception ex) when (ex is IOException or JsonException or UnauthorizedAccessException)
        {
            return null;
        }
    }
}

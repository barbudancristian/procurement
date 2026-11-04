using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Win32;

namespace SourcingHub.Desktop;

/// <summary>
/// Connection and storage settings, read in this order (later wins):
/// 1. config.json next to the app, 2. HKLM\SOFTWARE\Sourcing Hub (set by the MSI or
/// Group Policy), 3. C:\ProgramData\Sourcing Hub\config.json, 4. the choices this
/// Windows user made in the app (storage mode and site), kept in user.json.
/// </summary>
public sealed class AppConfig
{
    [JsonPropertyName("tenantId")] public string TenantId { get; set; } = "";
    [JsonPropertyName("clientId")] public string ClientId { get; set; } = "";
    [JsonPropertyName("siteUrl")] public string? SiteUrl { get; set; }

    /// <summary>"sharepoint", "local" or "demo". Empty: ask on first start (or SharePoint when IT configured it).</summary>
    [JsonPropertyName("mode")] public string? Mode { get; set; }

    /// <summary>Optional full path of the local database file.</summary>
    [JsonPropertyName("localDbPath")] public string? LocalDbPath { get; set; }

    [JsonIgnore] public string? SiteUrlSource { get; private set; }

    public static readonly string[] Modes = ["sharepoint", "local", "demo"];

    public static string MachineFile => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Sourcing Hub", "config.json");

    public static string InstallFile => Path.Combine(AppContext.BaseDirectory, "config.json");

    public static string UserFolder => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Sourcing Hub");

    static string UserFile => Path.Combine(UserFolder, "user.json");

    static readonly JsonSerializerOptions Json = new() { WriteIndented = true, DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };

    public bool SharePointConfigured => IsValid(out _);

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

    /// <summary>The storage mode to use now, or null when the user must choose.</summary>
    public string? EffectiveMode(bool demoRequested)
    {
        if (demoRequested) return "demo";
        if (Mode == "ask") return null;
        if (Mode is not null && Modes.Contains(Mode)) return Mode == "sharepoint" && !SharePointConfigured ? null : Mode;
        return SharePointConfigured ? "sharepoint" : null;
    }

    public string LocalDatabaseFile => !string.IsNullOrWhiteSpace(LocalDbPath)
        ? Environment.ExpandEnvironmentVariables(LocalDbPath)
        : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "Sourcing Hub", "sourcing-hub-data.json");

    public static AppConfig Load()
    {
        var config = new AppConfig();
        foreach (var layer in new[] { Read(InstallFile), ReadRegistry(), Read(MachineFile) })
            config.Overlay(layer);
        if (!string.IsNullOrWhiteSpace(config.SiteUrl)) config.SiteUrlSource = "machine";
        var user = Read(UserFile);
        if (!string.IsNullOrWhiteSpace(user?.SiteUrl)) config.SiteUrlSource = "user";
        config.Overlay(user);
        return config;
    }

    void Overlay(AppConfig? layer)
    {
        if (layer is null) return;
        if (!string.IsNullOrWhiteSpace(layer.TenantId)) TenantId = layer.TenantId.Trim();
        if (!string.IsNullOrWhiteSpace(layer.ClientId)) ClientId = layer.ClientId.Trim();
        if (!string.IsNullOrWhiteSpace(layer.SiteUrl)) SiteUrl = layer.SiteUrl.Trim();
        if (!string.IsNullOrWhiteSpace(layer.Mode)) Mode = layer.Mode.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(layer.LocalDbPath)) LocalDbPath = layer.LocalDbPath.Trim();
    }

    public void SaveUserSiteUrl(string siteUrl)
    {
        if (!Uri.TryCreate(siteUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps ||
            !uri.Host.EndsWith(".sharepoint.com", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("The address must be an https SharePoint Online site.");
        UpdateUserFile(u => u.SiteUrl = siteUrl);
        SiteUrl = siteUrl;
        SiteUrlSource = "user";
    }

    /// <summary>Saves this user's storage choice. Null clears it, so the app asks again.</summary>
    public void SaveUserMode(string? mode)
    {
        if (mode is not null && !Modes.Contains(mode))
            throw new InvalidOperationException("Unknown storage option.");
        if (mode == "sharepoint" && !SharePointConfigured)
            throw new InvalidOperationException("SharePoint is not available until IT registers the app and installs its settings.");
        // "ask" makes the app show the storage choice on the next start.
        UpdateUserFile(u => u.Mode = mode ?? "ask");
        Mode = mode ?? "ask";
    }

    static void UpdateUserFile(Action<AppConfig> change)
    {
        var user = Read(UserFile) ?? new AppConfig();
        change(user);
        Directory.CreateDirectory(UserFolder);
        var tmp = UserFile + ".tmp";
        File.WriteAllText(tmp, JsonSerializer.Serialize(new { siteUrl = NullIfEmpty(user.SiteUrl), mode = NullIfEmpty(user.Mode), localDbPath = NullIfEmpty(user.LocalDbPath) }, Json));
        File.Move(tmp, UserFile, overwrite: true);
    }

    static string? NullIfEmpty(string? s) => string.IsNullOrWhiteSpace(s) ? null : s;

    static AppConfig? ReadRegistry()
    {
        using var hklm = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
        using var key = hklm.OpenSubKey(@"SOFTWARE\Sourcing Hub");
        if (key is null) return null;
        return new AppConfig
        {
            TenantId = key.GetValue("TenantId") as string ?? "",
            ClientId = key.GetValue("ClientId") as string ?? "",
            SiteUrl = key.GetValue("SiteUrl") as string,
            Mode = key.GetValue("Mode") as string,
            LocalDbPath = key.GetValue("LocalDbPath") as string,
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

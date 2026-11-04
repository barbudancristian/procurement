using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text.Json;
using System.Windows;
using System.Windows.Interop;
using Microsoft.Identity.Client;
using Microsoft.Web.WebView2.Core;

namespace SourcingHub.Desktop;

public partial class MainWindow : Window
{
    // The interface is served from the install folder under this private host name.
    // Nothing else can be loaded in the window.
    const string AppHost = "app.sourcinghub.example";
    const string AppOrigin = "https://" + AppHost + "/";

    static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    readonly AppConfig _config = AppConfig.Load();
    AuthService? _auth;

    static string AppVersion =>
        Assembly.GetExecutingAssembly().GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion.Split('+')[0] ?? "0.0.0";

    public MainWindow()
    {
        InitializeComponent();
        Loaded += async (_, _) => await StartAsync();
    }

    async Task StartAsync()
    {
        if (!_config.IsValid(out var problem))
        {
            Status.Text = $"Sourcing Hub is not configured yet. {problem}\n\nIT needs to place config.json in {Path.GetDirectoryName(AppConfig.MachineFile)}. A sample is in the install folder.";
            Web.Visibility = Visibility.Collapsed;
            return;
        }
        _auth = new AuthService(_config, () => new WindowInteropHelper(this).Handle);

        try
        {
            var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(AppConfig.UserFolder, "WebView2"));
            await Web.EnsureCoreWebView2Async(env);
        }
        catch (WebView2RuntimeNotFoundException)
        {
            Status.Text = "Microsoft Edge WebView2 Runtime is missing on this computer. Ask IT to install it from https://go.microsoft.com/fwlink/p/?LinkId=2124703.";
            Web.Visibility = Visibility.Collapsed;
            return;
        }

        var core = Web.CoreWebView2;
        var s = core.Settings;
#if !DEBUG
        s.AreDevToolsEnabled = false;
        s.AreDefaultContextMenusEnabled = false;
#endif
        s.IsStatusBarEnabled = false;
        s.IsPasswordAutosaveEnabled = false;
        s.IsGeneralAutofillEnabled = false;
        s.AreHostObjectsAllowed = false;

        core.SetVirtualHostNameToFolderMapping(AppHost, Path.Combine(AppContext.BaseDirectory, "wwwroot"), CoreWebView2HostResourceAccessKind.Deny);
        core.NavigationStarting += (_, e) =>
        {
            if (!e.Uri.StartsWith(AppOrigin, StringComparison.OrdinalIgnoreCase))
            {
                e.Cancel = true;
                OpenExternal(e.Uri);
            }
        };
        core.NewWindowRequested += (_, e) =>
        {
            e.Handled = true;
            OpenExternal(e.Uri);
        };
        core.WebMessageReceived += OnMessage;

        Status.Visibility = Visibility.Collapsed;
        core.Navigate(AppOrigin + "index.html");
    }

    async void OnMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        if (!e.Source.StartsWith(AppOrigin, StringComparison.OrdinalIgnoreCase)) return;
        int id = 0;
        try
        {
            using var doc = JsonDocument.Parse(e.WebMessageAsJson);
            var root = doc.RootElement;
            id = root.GetProperty("id").GetInt32();
            var type = root.GetProperty("type").GetString();
            var payload = root.TryGetProperty("payload", out var p) ? p : default;
            object? result = type switch
            {
                "session" => await _auth!.SessionAsync(),
                "token" => (await _auth!.AcquireAsync()).AccessToken,
                "config" => ConfigView(),
                "setSiteUrl" => SetSiteUrl(payload.GetProperty("url").GetString() ?? ""),
                "signOut" => await SignOutAsync(),
                "openExternal" => OpenExternal(payload.GetProperty("url").GetString() ?? ""),
                _ => throw new InvalidOperationException("Unknown request."),
            };
            Reply(new { id, ok = true, result });
        }
        catch (MsalClientException ex) when (ex.ErrorCode == MsalError.AuthenticationCanceledError)
        {
            Reply(new { id, ok = false, error = "Sign-in was cancelled." });
        }
        catch (MsalException ex)
        {
            Reply(new { id, ok = false, error = $"Microsoft sign-in failed ({ex.ErrorCode}). If this continues, ask IT to check the app registration." });
        }
        catch (Exception ex) when (ex is InvalidOperationException or JsonException or KeyNotFoundException)
        {
            Reply(new { id, ok = false, error = ex.Message });
        }
    }

    void Reply(object message) => Web.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(message, Json));

    object ConfigView() => new
    {
        siteUrl = _config.SiteUrl,
        siteUrlSource = _config.SiteUrlSource,
        appVersion = AppVersion,
        tenantId = _config.TenantId,
        clientId = _config.ClientId,
    };

    object SetSiteUrl(string url)
    {
        _config.SaveUserSiteUrl(url);
        return ConfigView();
    }

    async Task<object?> SignOutAsync()
    {
        await _auth!.SignOutAsync();
        _ = Dispatcher.InvokeAsync(() => Web.CoreWebView2.Reload());
        return null;
    }

    static object? OpenExternal(string url)
    {
        if (Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps)
            Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
        return null;
    }
}

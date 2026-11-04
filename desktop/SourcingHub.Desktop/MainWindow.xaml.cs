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

    // Storage mode: "sharepoint", "local" (one database file, single user), "demo"
    // (sample data, started with --demo) or null (the user has not chosen yet).
    string? _mode;
    LocalDatabase? _localDb;
    readonly bool _demoRequested = Environment.GetCommandLineArgs().Any(a => a.Equals("--demo", StringComparison.OrdinalIgnoreCase));

    static string AppVersion =>
        Assembly.GetExecutingAssembly().GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion.Split('+')[0] ?? "0.0.0";

    public MainWindow()
    {
        InitializeComponent();
        Loaded += async (_, _) => await StartAsync();
        Closed += (_, _) => _localDb?.Dispose();
    }

    void ApplyMode()
    {
        _mode = _config.EffectiveMode(_demoRequested);
        if (_mode == "sharepoint")
            _auth ??= new AuthService(_config, () => new WindowInteropHelper(this).Handle);
        if (_mode == "local")
            _localDb ??= new LocalDatabase(_config.LocalDatabaseFile);
        else
        {
            _localDb?.Dispose();
            _localDb = null;
        }
        Title = _mode switch
        {
            "demo" => "Sourcing Hub (demo)",
            "local" => "Sourcing Hub (local database)",
            _ => "Sourcing Hub",
        };
    }

    async Task StartAsync()
    {
        ApplyMode();

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
                "session" => _mode == "local" ? LocalSession() : await Auth().SessionAsync(),
                "token" => (await Auth().AcquireAsync()).AccessToken,
                "setMode" => SetMode(payload.TryGetProperty("mode", out var m) ? m.GetString() : null),
                "localdb.read" => await LocalDb().ReadAsync(),
                "localdb.write" => await WriteLocalAsync(payload.GetProperty("content").GetString() ?? ""),
                "localdb.info" => LocalDb().Info(),
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
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            Reply(new { id, ok = false, error = $"The local database could not be saved: {ex.Message}" });
        }
        catch (Exception ex) when (ex is InvalidOperationException or JsonException or KeyNotFoundException)
        {
            Reply(new { id, ok = false, error = ex.Message });
        }
    }

    AuthService Auth() => _mode == "sharepoint" && _auth is not null ? _auth : throw new InvalidOperationException("Microsoft sign-in is only used with SharePoint storage.");

    LocalDatabase LocalDb() => _localDb ?? throw new InvalidOperationException("The local database is not in use.");

    async Task<object?> WriteLocalAsync(string content)
    {
        await LocalDb().WriteAsync(content);
        return null;
    }

    // In local mode the Windows user is the only user and has every permission.
    static object LocalSession() => new
    {
        name = Environment.UserName,
        username = $"{Environment.UserDomainName}\\{Environment.UserName}",
        tenantId = "",
        roles = new[] { "Sourcing.Admin" },
    };

    object? SetMode(string? mode)
    {
        _config.SaveUserMode(string.IsNullOrWhiteSpace(mode) ? null : mode);
        ApplyMode();
        _ = Dispatcher.InvokeAsync(() => Web.CoreWebView2.Reload());
        return null;
    }

    void Reply(object message) => Web.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(message, Json));

    object ConfigView() => new
    {
        mode = _mode,
        sharePointAvailable = _config.SharePointConfigured,
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
        await Auth().SignOutAsync();
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

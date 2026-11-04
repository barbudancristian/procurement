using System.Security.Claims;
using Microsoft.Identity.Client;
using Microsoft.Identity.Client.Broker;

namespace SourcingHub.Desktop;

/// <summary>
/// Signs the user in through the Windows account broker (WAM). Tokens and refresh
/// tokens stay inside Windows; the web interface only receives short-lived
/// Microsoft Graph access tokens.
/// </summary>
public sealed class AuthService
{
    static readonly string[] GraphScopes = ["https://graph.microsoft.com/.default"];

    readonly IPublicClientApplication _app;
    readonly Func<IntPtr> _window;
    IAccount? _account;
    AuthenticationResult? _last;

    public AuthService(AppConfig config, Func<IntPtr> window)
    {
        _window = window;
        _app = PublicClientApplicationBuilder.Create(config.ClientId)
            .WithAuthority(AzureCloudInstance.AzurePublic, config.TenantId)
            .WithDefaultRedirectUri()
            .WithParentActivityOrWindow(window)
            .WithBroker(new BrokerOptions(BrokerOptions.OperatingSystems.Windows) { Title = "Sourcing Hub" })
            .Build();
    }

    public async Task<AuthenticationResult> AcquireAsync(bool allowInteractive = true)
    {
        if (_last is not null && _last.ExpiresOn > DateTimeOffset.UtcNow.AddMinutes(5))
            return _last;
        try
        {
            var account = _account ?? (await _app.GetAccountsAsync()).FirstOrDefault() ?? PublicClientApplication.OperatingSystemAccount;
            _last = await _app.AcquireTokenSilent(GraphScopes, account).ExecuteAsync();
        }
        catch (MsalUiRequiredException) when (allowInteractive)
        {
            _last = await _app.AcquireTokenInteractive(GraphScopes)
                .WithParentActivityOrWindow(_window())
                .WithPrompt(Prompt.SelectAccount)
                .ExecuteAsync();
        }
        _account = _last.Account;
        return _last;
    }

    public async Task<object> SessionAsync()
    {
        var r = await AcquireAsync();
        var claims = r.ClaimsPrincipal?.Claims ?? [];
        string Claim(string type) => claims.FirstOrDefault(c => c.Type == type)?.Value ?? "";
        return new
        {
            name = Claim("name") is { Length: > 0 } n ? n : r.Account.Username,
            username = r.Account.Username,
            tenantId = r.TenantId,
            roles = claims.Where(c => c.Type is "roles" or ClaimTypes.Role).Select(c => c.Value).Distinct().ToArray(),
        };
    }

    public async Task SignOutAsync()
    {
        foreach (var a in await _app.GetAccountsAsync())
            await _app.RemoveAsync(a);
        _account = null;
        _last = null;
    }
}

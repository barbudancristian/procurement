using System.IO;
using System.Text;

namespace SourcingHub.Desktop;

/// <summary>
/// The single-user database file. The app holds a lock file while it runs, so a
/// second window or another user cannot open the same database. Every save writes
/// a temporary file first and then swaps it in, so a crash never leaves a half
/// written database. A daily copy is kept in the backups folder for 14 days.
/// </summary>
public sealed class LocalDatabase : IDisposable
{
    const long MaxBytes = 200L * 1024 * 1024;
    const int BackupDays = 14;

    readonly string _path;
    readonly string _backups;
    readonly SemaphoreSlim _gate = new(1, 1);
    FileStream? _lock;

    public LocalDatabase(string path)
    {
        _path = Path.GetFullPath(path);
        _backups = Path.Combine(Path.GetDirectoryName(_path)!, "backups");
    }

    public string FilePath => _path;

    void EnsureOpen()
    {
        if (_lock is not null) return;
        Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
        try
        {
            _lock = new FileStream(_path + ".lock", FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None, 1, FileOptions.DeleteOnClose);
        }
        catch (IOException)
        {
            throw new InvalidOperationException("The local database is already open in another Sourcing Hub window or by another user.");
        }
    }

    public async Task<string?> ReadAsync()
    {
        await _gate.WaitAsync();
        try
        {
            EnsureOpen();
            return File.Exists(_path) ? await File.ReadAllTextAsync(_path, Encoding.UTF8) : null;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task WriteAsync(string content)
    {
        if (Encoding.UTF8.GetByteCount(content) > MaxBytes)
            throw new InvalidOperationException("The local database is too large. Move to SharePoint or archive old projects.");
        await _gate.WaitAsync();
        try
        {
            EnsureOpen();
            BackUpOncePerDay();
            var tmp = _path + ".tmp";
            await using (var fs = new FileStream(tmp, FileMode.Create, FileAccess.Write, FileShare.None))
            await using (var w = new StreamWriter(fs, new UTF8Encoding(false)))
            {
                await w.WriteAsync(content);
                await w.FlushAsync();
                fs.Flush(flushToDisk: true);
            }
            if (File.Exists(_path)) File.Replace(tmp, _path, null);
            else File.Move(tmp, _path);
        }
        finally
        {
            _gate.Release();
        }
    }

    void BackUpOncePerDay()
    {
        if (!File.Exists(_path)) return;
        Directory.CreateDirectory(_backups);
        var name = Path.GetFileNameWithoutExtension(_path);
        var today = Path.Combine(_backups, $"{name}-{DateTime.Now:yyyy-MM-dd}.json");
        if (!File.Exists(today)) File.Copy(_path, today);
        foreach (var old in Directory.GetFiles(_backups, $"{name}-*.json").OrderByDescending(f => f).Skip(BackupDays))
            File.Delete(old);
    }

    public object Info()
    {
        var fi = new FileInfo(_path);
        var name = Path.GetFileNameWithoutExtension(_path);
        return new
        {
            path = _path,
            sizeBytes = fi.Exists ? fi.Length : 0,
            lastSaved = fi.Exists ? fi.LastWriteTimeUtc.ToString("o") : null,
            backups = Directory.Exists(_backups) ? Directory.GetFiles(_backups, $"{name}-*.json").Length : 0,
        };
    }

    public void Dispose()
    {
        _lock?.Dispose();
        _gate.Dispose();
    }
}

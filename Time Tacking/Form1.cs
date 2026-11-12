/*namespace Time_Tacking
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }
    }
}*/

using Microsoft.Web.WebView2.Core;
using Time_Tacking.WebView;

namespace Time_Tacking
{
    public partial class frmTimeTracking : Form
    {
        private JsBridge? _puente;

        public frmTimeTracking()
        {
            InitializeComponent();

            Load += async (s, e) =>
            {
                await wvIndex.EnsureCoreWebView2Async();
                var carpeta = Path.Combine(AppContext.BaseDirectory, "web");
                wvIndex.CoreWebView2.SetVirtualHostNameToFolderMapping(
                    "app.local", carpeta, CoreWebView2HostResourceAccessKind.Allow);
                _puente = new JsBridge(wvIndex.CoreWebView2, this);
                wvIndex.CoreWebView2.Navigate("https://app.local/index.html");
            };
        }
    }
}
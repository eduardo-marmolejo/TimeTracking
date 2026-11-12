namespace Time_Tacking
{
    partial class frmTimeTracking
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(frmTimeTracking));
            wvIndex = new Microsoft.Web.WebView2.WinForms.WebView2();
            ((System.ComponentModel.ISupportInitialize)wvIndex).BeginInit();
            SuspendLayout();
            // 
            // wvIndex
            // 
            wvIndex.AllowExternalDrop = true;
            wvIndex.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            wvIndex.CreationProperties = null;
            wvIndex.DefaultBackgroundColor = Color.White;
            wvIndex.Location = new Point(0, 0);
            wvIndex.Margin = new Padding(3, 2, 3, 2);
            wvIndex.Name = "wvIndex";
            wvIndex.Size = new Size(1662, 818);
            wvIndex.TabIndex = 0;
            wvIndex.ZoomFactor = 1D;
            // 
            // frmTimeTracking
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(1662, 796);
            Controls.Add(wvIndex);
            Icon = (Icon)resources.GetObject("$this.Icon");
            Margin = new Padding(3, 2, 3, 2);
            Name = "frmTimeTracking";
            StartPosition = FormStartPosition.CenterScreen;
            Text = "Time Tracking";
            WindowState = FormWindowState.Maximized;
            ((System.ComponentModel.ISupportInitialize)wvIndex).EndInit();
            ResumeLayout(false);
        }

        #endregion

        private Microsoft.Web.WebView2.WinForms.WebView2 wvIndex;
    }
}

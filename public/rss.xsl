<?xml version="1.0" encoding="UTF-8"?>
<!-- ============================================================
     📡 RSS 订阅页的样式表（XSLT）
     · 浏览器直接打开 /rss.xml 时，按这份样式渲染成网页；
     · RSS 阅读器不读样式表，只取数据，两边互不影响~♡
     ============================================================ -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8"/>

  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>RSS 订阅 · <xsl:value-of select="/rss/channel/title"/></title>
        <style>
          :root {
            --accent: #cf5b96;
            --accent2: #b969c9;
            --text: #3a3348;
            --dim: #7b7490;
            --line: #efdfe9;
            --card: #fffdfe;
            --bg: linear-gradient(160deg, #fff5fa 0%, #f6f0ff 55%, #eef4ff 100%);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --text: #ece8f5;
              --dim: #a79fbe;
              --line: #3a3350;
              --card: #1d1929;
              --bg: linear-gradient(160deg, #191423 0%, #1a1626 60%, #151a28 100%);
            }
          }
          * { box-sizing: border-box; }
          body {
            margin: 0; padding: 40px 18px 60px;
            background: var(--bg); color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
            line-height: 1.75; -webkit-font-smoothing: antialiased;
          }
          .wrap { max-width: 720px; margin: 0 auto; }
          .head { margin-bottom: 26px; }
          .brand { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; letter-spacing: 2px; color: var(--dim); }
          .dot { width: 7px; height: 7px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); }
          h1 { margin: 10px 0 4px; font-size: 26px; letter-spacing: 1px; }
          .sub { margin: 0 0 16px; font-size: 13px; color: var(--dim); }
          .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
          .pill {
            padding: 5px 12px; border-radius: 999px; font-size: 12px;
            border: 1px solid var(--line); background: var(--card); color: var(--dim);
          }
          .url {
            flex: 1 1 260px; padding: 8px 14px; border-radius: 999px;
            border: 1px dashed var(--line); background: var(--card);
            font-family: "JetBrains Mono", Consolas, monospace; font-size: 12px;
            color: var(--accent); overflow-wrap: anywhere;
          }
          .item {
            padding: 18px 20px; margin-bottom: 14px; border-radius: 16px;
            background: var(--card); border: 1px solid var(--line);
          }
          .when { font-size: 11.5px; letter-spacing: 1.5px; color: var(--dim); font-variant-numeric: tabular-nums; }
          .t { margin: 4px 0 6px; font-size: 17px; line-height: 1.5; }
          .t a { color: var(--text); text-decoration: none; border-bottom: 1px solid transparent; transition: color .2s, border-color .2s; }
          .t a:hover { color: var(--accent); border-bottom-color: var(--accent); }
          .excerpt { margin: 0; font-size: 13px; color: var(--dim); }
          .tags { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
          .tag {
            padding: 2px 9px; border-radius: 999px; font-size: 11px;
            color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent);
          }
          .foot { margin-top: 26px; text-align: center; font-size: 12px; color: var(--dim); }
          .foot a { display: inline-block; margin-top: 8px; padding: 7px 16px; border-radius: 999px;
            border: 1px solid var(--line); background: var(--card); color: var(--accent); text-decoration: none; }
          .foot a:hover { border-color: var(--accent); }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header class="head">
            <div class="brand"><span class="dot"></span><xsl:value-of select="/rss/channel/title"/></div>
            <h1>RSS 订阅</h1>
            <p class="sub"><xsl:value-of select="/rss/channel/description"/></p>
            <div class="bar">
              <span class="pill">共 <xsl:value-of select="count(/rss/channel/item)"/> 篇</span>
              <code class="url"><xsl:value-of select="concat(/rss/channel/link, 'rss.xml')"/></code>
            </div>
          </header>

          <main>
            <xsl:for-each select="/rss/channel/item">
              <xsl:variable name="pd" select="pubDate"/>
              <xsl:variable name="mon" select="substring($pd, 9, 3)"/>
              <xsl:variable name="mm">
                <xsl:choose>
                  <xsl:when test="$mon = 'Jan'">01</xsl:when>
                  <xsl:when test="$mon = 'Feb'">02</xsl:when>
                  <xsl:when test="$mon = 'Mar'">03</xsl:when>
                  <xsl:when test="$mon = 'Apr'">04</xsl:when>
                  <xsl:when test="$mon = 'May'">05</xsl:when>
                  <xsl:when test="$mon = 'Jun'">06</xsl:when>
                  <xsl:when test="$mon = 'Jul'">07</xsl:when>
                  <xsl:when test="$mon = 'Aug'">08</xsl:when>
                  <xsl:when test="$mon = 'Sep'">09</xsl:when>
                  <xsl:when test="$mon = 'Oct'">10</xsl:when>
                  <xsl:when test="$mon = 'Nov'">11</xsl:when>
                  <xsl:when test="$mon = 'Dec'">12</xsl:when>
                  <xsl:otherwise>01</xsl:otherwise>
                </xsl:choose>
              </xsl:variable>
              <xsl:variable name="txt" select="substring-before(concat(description, '&lt;'), '&lt;')"/>
              <article class="item">
                <div class="when"><xsl:value-of select="concat(substring($pd, 13, 4), '-', $mm, '-', substring($pd, 6, 2))"/></div>
                <h2 class="t"><a href="{link}"><xsl:value-of select="title"/></a></h2>
                <p class="excerpt">
                  <xsl:value-of select="substring(normalize-space($txt), 1, 110)"/>
                  <xsl:if test="string-length(normalize-space($txt)) &gt; 110">…</xsl:if>
                </p>
                <xsl:if test="category">
                  <div class="tags">
                    <xsl:for-each select="category"><span class="tag"><xsl:value-of select="."/></span></xsl:for-each>
                  </div>
                </xsl:if>
              </article>
            </xsl:for-each>
          </main>

          <footer class="foot">
            <p>把上面的地址粘到任意 RSS 阅读器里就能订阅~♡</p>
            <a href="{/rss/channel/link}">← 回到首页</a>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

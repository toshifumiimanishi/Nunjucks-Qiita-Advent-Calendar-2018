# 詳解 Nunjucks − Mozilla 謹製テンプレートエンジン

Qiita の記事は[こちら](https://qiita.com/toshifumiimanishi/private/d3fd1035697618c3c33b)

## はじめに

[**Nunjucks（ナンジャックス）**](https://mozilla.github.io/nunjucks/)とは、**ブロック継承、オートエスケープ、マクロ、非同期制御** などを備えた **Mozilla 謹製 のテンプレートエンジン** である。Python のテンプレートエンジンである [Jinja（ジンジャ）](http://jinja.pocoo.org/)に影響を受けている。有名かつ人気のあるテンプレートエンジンは、以下の通りである。

- [Pug](https://pugjs.org/api/getting-started.html)（インデント構文）
- [EJS](https://ejs.co/)（HTML ベースの構文）

Nunjucks は EJS と同じ **HTML ベースの構文** であり EJS より **強力な言語**（筆者の主観）である。

## 基本情報
拡張子は `.njk` である。エディタの言語サポート用プラグインは[公式サイト](https://mozilla.github.io/nunjucks/templating.html#syntax-highlighting)でいくつか紹介されている。変数の参照は、マスタッシュ記法 `{{}}` でおこなう。

## 開発環境の解説
[gulp-nunjucks-render](https://www.npmjs.com/package/gulp-nunjucks-render) で HTML にコンパイルする。gulp-nunjucks-render は、標準でデータの参照渡しを搭載しているが、ファイルの現在位置を返す API を利用するため [gulp-data](https://www.npmjs.com/package/gulp-data) を併用する。

```js:gulpfile.js
const gulp = require('gulp');
const nunjucksRender = require('gulp-nunjucks-render');
const data = require('gulp-data');
```

**各オプションの解説**  
ルートパスの指定やデータ参照を標準搭載している。ルートパスの指定は、ルート相対パスでファイル参照できるため、**階層の異なるテンプレートファイルに便利** である。データの参照は、**メタ情報を JSON で管理する際に便利** である。

- **path**：ルートパスの指定
- **data**：データの参照
- **envOptions**：Nunjucks の標準機能の変更

```js:gulpfile.js
// 一部抜粋
.pipe(nunjucksRender({
  path: ['htdocs/_nunjucks/'],
  data: sitedata,
  envOptions: {
    autoescape: false
  }
}))
```

`envOptions: { autoescape: false }` は三項演算子を利用する上で便宜的に特殊文字のエスケープを回避している。`envOptions` の詳細は[公式サイト](https://mozilla.github.io/nunjucks/api.html#configure)を参照ください。

```js
const getDataForFile = file => {
  sitedata.path.relative = file.relative.replace(/\.njk/, '\.html').replace(/index\.html/, '');
  sitedata.path.absolute = sitedata.path.domain + sitedata.path.relative;
  return sitedata;
};
```

`getDataForFile` 関数は、gulp-data で絶対パスを返す関数である。メタ情報の URL の自動入力に便利である。`sitedata` は任意の JSON ファイルである。

## 独自記法の解説
Nunjucks は、タグの記法が特殊なため直感的に書き辛いケースがある。運用する上で迷いがちなケースをいくつか紹介する。詳しくは[公式サイト](https://mozilla.github.io/nunjucks/templating.html#tags)を参照ください。

**変数の宣言**  
`{% set %}` で変数を宣言する。

```html
{% set username = "joe" %}
```

**独自タグとマスタッシュ記法の競合を避ける**
他言語のマスタッシュ記法として使用する場合、 `{% raw %}` を使用する。

```html:input
<div>{% raw %}{{ message }}{% endraw %}</div>
```

```html:output
<div>{{ message }}</div>
```

**三項演算子**  
JavaScript の三項演算子と同様に if をインライン式で使用できる。

```html
{{ "true" if foo else "false" }}
```

JavaScript の三項演算子とは異なり、`else` はオプションである。

```html
{{ "true" if foo }}
```


**関数の宣言**  
関数は、`{% macro %}` で宣言する。引数にはデフォルトを指定することができ、デフォルト引数は順不同で指定できる。詳細は[公式サイト](https://mozilla.github.io/nunjucks/templating.html#keyword-arguments)を参照ください。


```html:input
<!-- 関数の宣言 -->
{% macro field(name, value, type='text') %}
<input type="{{ type }}" name="{{ name }}" value="{{ value }}">
{% endmacro %}

<!-- 関数の呼び出し -->
{{ field('user', 'pass') }}
{{ field('user', type='password', 'pass') }}
```

```html:output
<input type="text" name="user" value="pass">
<input type="password" name="user" value="pass">
```

**内蔵フィルター**  
Nunjucks は、フィルターを用意している。`{% filter %}` と `|` のふたつの構文が用意されている。詳細は[公式サイト](https://mozilla.github.io/nunjucks/templating.html#builtin-filters)を参照ください。

```html:フィルター
<div>{{ 'Xmas' | replace('Xmas', 'Christmas') }}</div>
```

Nunjucks で正規表現を使用する場合、正規表現リテラル `//` の接頭辞に `r` が必要である。詳細は[公式サイト](https://mozilla.github.io/nunjucks/templating.html#regular-expressions)を参照ください。

```html:正規表現
<div>{{ 'Xmas'.replace(r/xmas/i, 'Christmas') }}</div>
```

## 運用パターン
他のテンプレートエンジンで利用される運用パターンを Nunjucks に **置き換えたパターン** や **独自の運用パターン** をいくつか紹介する。サンプルコードにある `{%-` や `-%}` は不要な空白を制御する記述である。

### ストラクチャのインクルード
`include` で別ファイルを読み込むことができる。以下、パンくずリストを例に運用パターンを説明する。なお、サンプルコードは [Microdata](https://schema.org/BreadcrumbList) や [WAI-ARIA](https://www.w3.org/TR/wai-aria-1.1/#aria-current) を一部使用している。

```html:index.njk
{%- set breadcrumbs = [{item: '第二階層', href: '/example.html'}, {item: '第三階層'}]-%}
{%- include '_breadcrumb.njk' %}
```

インクルード先の `_breadcrumb.njk` に変数を渡すため、インクルード元 `index.njk` で変数 `breadcrumbs` を定義する。

```html:_breadcrumb.njk
<nav aria-label="breadcrumb">
  <ol itemscope itemtype="http://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
      <a href="/" itemprop="item">
        <span itemprop="name">HOME</span>
      </a>
      <meta itemprop="position" content="1" />
    </li>
    {%- for breadcrumb in breadcrumbs %}
    <li itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem"{{ ' aria-current="page"' if loop.last }}>
      {%- if loop.last %}
      <span itemprop="name">{{ breadcrumb.item }}</span>        
      <meta itemprop="position" content="{{ loop.index + 1 }}" />
      {%- else %}
      <a href="{{ breadcrumb.href }}" itemprop="item">
        <span itemprop="name">{{ breadcrumb.item }}</span>
      </a>
      <meta itemprop="position" content="{{ loop.index + 1 }}" />
      {%- endif %}
    </li>
    {%- endfor %}
  </ol>
</nav>
```

インクルード先の `_breadcrumb.njk` では、**for 文** と **if 文** ならびに **三項演算子** を使用している。for 文で変数 `breadcrumbs` に定義した配列をまわし、if 文と三項演算子で最後の反復に対する条件分岐をおこなう。for 文の反復処理内では、特殊変数 `loop ` を利用できる。`loop.last` は、最後の反復処理を示すブール値を返す。`loop.index` は反復処理の現在のカウンタ（1 始まり）を返す。`loop` の詳細は[公式サイト](https://mozilla.github.io/nunjucks/templating.html#for)を参照ください。生成された HTML は以下の通りである。

```html:index.html
<nav aria-label="breadcrumb">
  <ol itemscope itemtype="http://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
      <a href="/" itemprop="item">
        <span itemprop="name">HOME</span>
      </a>
      <meta itemprop="position" content="1" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
      <a href="/example.html" itemprop="item">
        <span itemprop="name">第二階層</span>
      </a>
      <meta itemprop="position" content="2" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem" aria-current="page">
      <span itemprop="name">第三階層</span>        
      <meta itemprop="position" content="3" />
    </li>
  </ol>
</nav>
```

### テンプレート継承
テンプレート継承は、テンプレートの再利用を容易にする。 `extends` でテンプレートを継承し、テンプレート内にオーバーライドできる `block` を定義する。また、サブタイプ（子テンプレート）の `block` 内で `super` を呼ぶことでスーパータイプ（親テンプレート）を出力できる。

```html:_base.njk
<!DOCTYPE html>
<html lang="ja">
<head>
{% include '_meta.njk' %}
{% block css -%}
<link rel="stylesheet" href="/css/main.css">
{%- endblock %}
</head>
<body>
{% block content %}
{% endblock %}
{% block js -%}
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
{%- endblock %}
</body>
</html>
```

テンプレートの `_base.njk` には、共通で読み込む CSS, JS を記述し、個別ページで読み込む CSS, JS は `block` で定義する。メタ情報は `include` で読み込ませ、個別ページの識別子を渡すことで各ページのメタ情報が出力される。

```html:index.njk
{% extends "_base.njk" %}
{%- set pagename = top -%}

{% block css -%}
{{ super() }}
<link rel="stylesheet" href="/css/top.css">
{%- endblock %}

{% block content -%}
<main></main>
{%- endblock %}

{% block js -%}
{{ super() }}
<script src="/js/top.js"></script>
{%- endblock %}
```

`extends` で `_base.njk` 継承する。変数 `pagename` は、個別ページの識別子である。`block` 内の `super()` は、`_base.njk` にある `main.css`, `jquery.min.js` を出力する。

```html:_meta.njk
<!-- 一部抜粋 -->
<title>{{ pagename.title }}</title>
<meta name="description" content="{{ pagename.description }}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="format-detection" content="telephone=no">
<meta property="og:title" content="{{ pagename.title }}">
<meta property="og:description" content="{{ pagename.description }}">
<meta property="og:type" content="{{ 'website' if pagename === top else 'article' }}">
<meta property="og:url" content="{{ path.absolute }}">
<meta property="og:image" content="{{ pagename.ogimage }}">
```

メタ情報は JSON で管理し、gulp で読み込ませる。`og:type` は三項演算子で `website` と `article` に分岐させ、`og:url` の `path.absolute` は、絶対パスを出力するよう設定する。

### 共通モジュールの再利用
共通モジュールは、再利用可能なマクロに定義する。定義したマクロは `import` でアクセスできる。エクスポートされたマクロは変数にバインドされる。`picture` 要素のレスポンシブイメージを例に説明する。

```html:_macro.njk
{% macro picture(src, alt='', className='', media='min-width: 768px') -%}
<picture{{ ' class="' + className + '"' if className }}>
  <source srcset="{{ src | replace('_sm.', '_lg.') }}" media="({{ media }})">
  <img src="{{ src }}" alt="{{ alt }}">
</picture>
{%- endmacro %}
```

`alt`, `className`, `media` は、順不同に対応できるデフォルト引数で定義する。`srcset` はフィルターで最適な画像名に置換する。

```html:index.njk
{%- import '_macro.njk' as macro -%}
{{ macro.picture('example_sm.jpg', media='min-width: 640px') }}
```

`import` は、任意の名前空間からバインドされたマクロにアクセスできる。出力された HTML は以下の通りである。

```html:index.html
<picture>
  <source srcset="example_lg.jpg" media="(min-width: 640px)">
  <img src="example_sm.jpg" alt="">
</picture>
```

## まとめ
Nunjucks は、EJS と同じ **HTML ベースの構文** で **テンプレート継承** を標準搭載する強力な言語である。**Mozilla 謹製** の信頼性と現在（2018/12/20 執筆時点）も開発がおこなわれているため、新たなテンプレートエンジンの切り替え、または技術選定の候補として挙げてみるのはいかがだろう。

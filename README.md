# HTMLDoc

[![Travis CI](https://api.travis-ci.org/cxpartners/HTMLDoc.svg)](https://travis-ci.org/cxpartners/HTMLDoc)

***

HTMLDoc is a tool to create [style guides and pattern libraries](https://cxpartners.github.io/htmldoc-example-bootstrap/) by annotating markup in HTML files using HTML comments.  The information contained within the annotations is combined with [templates] (https://github.com/cxpartners/htmldoc-bootstrap-styleguide-theme) to generate a style guide using the HTMLDoc command line tool.

***

At it's most basic, an HTMLDoc comment looks like this:


```
<!--- title: Buttons -->
```

*Note the triple dashes in the opening comment tag - this specifies the comment as an HTMLDoc comment.*

A more complex example, which includes developer and usage notes:


```
<!---
title: Buttons
group: Theme
usage: Use any of the available button classes to quickly create a styled button.
devnotes: >
  Fancy larger or smaller buttons?
  Add `.btn-lg`, `.btn-sm`, or `.btn-xs` for additional sizes.
-->
<p>
  <button type="button" class="btn btn-lg btn-default">Default</button>
  <button type="button" class="btn btn-lg btn-primary">Primary</button>
  <button type="button" class="btn btn-lg btn-success">Success</button>
  <button type="button" class="btn btn-lg btn-info">Info</button>
  <button type="button" class="btn btn-lg btn-warning">Warning</button>
  <button type="button" class="btn btn-lg btn-danger">Danger</button>
  <button type="button" class="btn btn-lg btn-link">Link</button>
</p>
```

Which will give you something [like this](http://cxpartners.github.io/htmldoc-example-bootstrap/components-theme-buttons.html).

The comment is placed adjacent (in DOM terms) to the element that contains the component you wish to include in the style guide.

The annotations are written in Yaml format, and the field values support markdown.

***

## Motivation

There have been a number of attempts at creating living style guides and pattern libraries, but many have required manually copying across chunks of HTML into the style guide. The problem being that the markup then needs to be maintained in two separate locations - the style guide AND the source code of the project.

The main motivation behind the creation of HTMLDoc is to:

- Reduce the maintenance overheads of manually copying across components and patterns into a separate location.
- Ensure the style guide is always in sync with any changes made or new patterns and components added to the source project.
- Ensure updates can't be made directly to the style guide itself which may change the definition of the components. The patterns and components are defined within development source code, not in the style guide.
- Document the metadata required to describe the state of the component.
- Keep the metadata annotations close to the place they're used. Again this helps with maintaining the style guide.

# Installation

Install from Github repo (not on NPM yet):

    $ npm install -g cxpartners/HTMLDoc

Checkout example project at [](https://github.com/cxpartners/htmldoc-example-bootstrap), then run `HTMLDoc`:

    $ htmldoc --preview


A webserver will be running on `localhost:3000` and the built project will be in `publish` (see configuration file at
[](https://github.com/cxpartners/htmldoc-example-bootstrap/blob/master/htmldoc.yaml).

For options:

    $ htmldoc --help


# Getting Started

- Install HTMLDoc as outlined above
- Checkout an example styleguide wrapper at [](https://github.com/cxpartners/htmldoc-bootstrap-styleguide-theme)
- Add HTMLDoc comments to your code
- Create a `htmldoc.yaml` configuration file (yet to be documented see [here](https://github.com/cxpartners/htmldoc-example-bootstrap/blob/master/htmldoc.yaml) for an example)
- Run `htmldoc` on the command line, from the same directory as the `htmldoc.yaml` file

The built styleguide will be placed in a `./publish` folder.

# HTMLDoc Comment Annotations

With the exception of a set of reserved field names, HTMLDoc annotations are schemaless, i.e. they can have varying numbers of fields, and different types for each field.

All fields are made available within the [`pattern.hbs`](https://github.com/cxpartners/htmldoc-example-bootstrap/blob/master/styleguide/pattern.hbs) template, for example:

`index.html`:


```
<!---
title: My component
developer_notes: This is additional information
-->
```

`pattern.hbs`:

```
{{#if developer_notes}}
  <h1>Developer Notes</h1>
  {{developer_notes}}
{{/if}}
```


## Dom Matching

The annotation needs to be placed before the element that is to be documented.

```
<!--- title: Heading 1 -->
<div>
    <h1>Heading 1</h1>
</div>
```

***

## Fields

The following fields have special use within the system:

- ### `title`

    *Description*: The title of the component
    
    *Required*: true

    example:

    ```
    <!--- title: Heading 1 -->
    <h1>Heading 1</h1>
    ```


- ### `group`

    *Description*: The group the component belongs to

    *Default*: The name of the file the component is defined in

    For example, if the annotation is made for HTML elements in a file named `forms.html`, the group would be "forms".

    The group mainly impacts the navigation.

    ```
    <!---
    title: Heading 1
    group: Typography
    -->
    <h1>Heading 1</h1>
    ```

- ### `type`

    *Description*: The type of component being annotated
    
    *Options*: `component` or `template`
    
    *Default*: `component`

    Both individual components and example templates that contain collections of components can be annotated.  By specifying the `type` as `template`, HTMLDoc will:

    - Ignore all other annotations within the file so that duplications of components aren't made.
    - Not match any HTML to the component - it will use all HTML within the file to produce the pattern.

    [This example](http://cxpartners.github.io/htmldoc-example-bootstrap/examples-jumbotrons-example-1.html) shows a full page template with the annotation from the [source file](https://github.com/cxpartners/htmldoc-example-bootstrap/blob/master/www/jumbotron/index.html#L31).

- ### `external`

    *Description*: Determine whether the component should be showed on an external page, outside of the style guide

    *Options*: `true` or `false`

    *Default*: `false`

    Some components lend themselves to be shown on a separate page, outside of the style guide theme.  Setting this field to `true` will ensure that a component page will be generated using a [`wrapper-external.hbs`](https://github.com/cxpartners/htmldoc-bootstrap-styleguide-theme/blob/master/wrapper-external.hbs) template so that the developer of the style guide can decide how to show the component without any of the style guide theme.

    The page can be referenced in the [`pattern.hbs`](https://github.com/cxpartners/htmldoc-bootstrap-styleguide-theme/blob/master/pattern.hbs) template using the `url-external` Handlebars helper, e.g.:

    ```
    {{#if external}}
    <h2>View <a href="{{ url-external this }}">{{title}}</a>.</h2>
    {{/if}}
    ```

    An example of this in use can be found [here](http://cxpartners.github.io/htmldoc-example-bootstrap/examples-jumbotrons-example-1.html).


- ### `hide`

    *Description*: An array of fields to exclude from the pattern library generation

     There may be situations where you want to keep fields in the original source files, but don't want them to show up in the pattern library.  By specifing such fields in the `hide` field, you ensure they are not included.

    ```
    <!---
    title: Global Colours
    group: Brand
    designs: [http://www.example.com/screengrabs/patterns/1colour.jpg]
    hide: [designs]
    -->
    ```

	In the above example, the `designs` field will not be available to the templates, effectively hiding it in the pattern library.

## External values

Values for fields can be loaded from external sources. This is useful for when you want to pull in additional information that isn't really suited to be defined in markup.

- ### `file://`

    Read content from a file within the filesystem.

    example:

    ```
    <!---
    title: Modal
    group: Javascript
    usage:
        external: file://docs/typography.md
    -->
    <h1>Heading 1</h1>
    ...
    ```
     
    Within the filesystem the contents of `./doc/typography.md` would be used as the value for the `usage` field.

- ### `http://`

     The same as above, but reading a file from an HTTP source.

     example:

    ```
    <!---
    title: Modal
    group: Javascript
    usage:
        external: https://www.dropbox.com/s/vzrg6sj3uddj4p1/Typography.md
    -->
    <h1>Heading 1</h1>
    ...
    ```

### Behavioural Specifications

An example of where external files can be put to good use is by pulling Gherkin feature files into the style guide, so that behavioural specifications can be added to components which have interactions.

An example can be seen [here](http://cxpartners.github.io/htmldoc-example-bootstrap/components-javascript-modal.html) and uses the following annotations:

```
<!---
title: Modal
group: Javascript
spec:
    external: file://spec/modal.feature
description: Modals are streamlined, but flexible, dialog prompts with the minimum required functionality and smart defaults.
devnotes: >
  *Overlapping modals not supported*: Be sure not to open a modal while another is still visible. Showing more than one modal at a time requires custom code.
-->
```

In this case the file [`spec/modal.feature`](https://github.com/cxpartners/htmldoc-example-bootstrap/blob/master/spec/modal.feature) contains the specification for the modal popup.


# Configuration

The HTMLDoc tool is run in the same directory as a `htmldoc.yaml` file which defines how it should be run.

An example can be found [here](https://github.com/cxpartners/htmldoc-example-bootstrap/blob/master/htmldoc.yaml).

## ``htmldoc.yaml`` Configuration File Options

- ### `publish`

     *Description*: The directory the generated style guide files should be saved into.
     
     *Default*: `publish`

- ### `templates`

    *Description*: The directory which contains the Handlebar templates for the style guide theme.

- ### `template_assets`

    *Description*: The directory within the `templates` folder which contains the theming assets (CSS / JS etc.).

- ### `files`

    *Description*: An array of objects defining where the source files containing the annotations are.

    example:

    ```
    files:
      - category: Components
        files: ['./**/*.html']
      - category: Examples
        files: ['./www/jumbotron/**/*.html', './www/dashboard/**/*.html']
    ```

- #### `files.category`

    *Description*: The name that will be used for the category of components in the navigation for the components found in the files.

- #### `files.files`

    *Description*: [Globbing](https://github.com/isaacs/node-glob) patterns that define the files that contain components.

- ### `pages`

    *Description*: An array of static 'page' files that can be added to the main navigation so that instructions, download guides etc. can be included within your style guide.

	Here is an [example](http://cxpartners.github.io/htmldoc-example-bootstrap/page-getting-started.html) which is generated from this [source file](https://github.com/cxpartners/htmldoc-example-bootstrap/blob/master/getting-started.md).

	example:

	```
	pages:
	  - index:    true
	    src:      ./index.md
	  - title:    Getting Started
	    src:      ./getting-started.md
	```

- #### `pages.index`

	*Description*: One page can be set as the index page for the style guide by setting this to `true` and omitting the `title` field.

- #### `pages.src`

    *Description*: The source file for the page (markdown can be used).

- #### `pages.title`

    *Description*: The name of link to the page in the navigation.

## Commandline Options

Run `htmldoc --help` to view commandline options.

# Templating

HTMLDoc uses Handlebars for the templating system of the style guide.

An example theme based on [Twitter's Bootstrap](http://getbootstrap.com/) can be found at [](https://github.com/cxpartners/htmldoc-bootstrap-styleguide-theme).

By design, the style guide templates are considered to be contained within a folder in the source code repository, i.e. a template for each project you undertake is expected.


## Handlebar Helpers

@todo

## Global variables

@todo

# Known Limitations

@todo

# Roadmap

@todo

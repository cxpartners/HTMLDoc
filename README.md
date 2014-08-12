# HTMLDoc

HTMLDoc is a tool to create [styleguides](http://koded.github.io/htmldoc-example-bootstrap/) but annotating markup using
HTML comments.

For example:

```
<!--- title: Headings -->
<h1>This is an Heading</h1>
```

Note the triple dashes in the opening comment tag - this specifies the comment as an HTMLDoc comment.

# Installation

Install from Github repo (not on NPM yet):

    $ npm install -g git+https://github.com/Koded/HTMLDoc.git

Checkout example project at https://github.com/Koded/htmldoc-example-bootstrap, then run `HTMLDoc`:

    $ htmldoc --preview


A webserver will be running on `localhost:3000` and the built project will be in `publish` (see configuration file at
https://github.com/Koded/htmldoc-example-bootstrap/blob/master/htmldoc.yaml).

For options:

    $ htmldoc --help


# Getting Started

- Install HTMLDoc as outlined above
- Checkout an example styleguide wrapper at https://github.com/Koded/htmldoc-bootstrap-styleguide-theme
- Add HTMLDoc comments to your code
- Create a `htmldoc.yaml` configuration file (yet to be documented see [here](https://github.com/Koded/htmldoc-example-bootstrap/blob/master/htmldoc.yaml) for an example)
- Run htmldoc on the command line, from the same directory as the `htmldoc.yaml` file

The built styleguide will be placed in the `./publish` folder.



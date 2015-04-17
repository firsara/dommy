# dommy.js

> minimal requirejs-based framework for creating touch applications

## Installation

### Grab the latest version

Grab the latest version via git

    git clone https://github.com/firsara/dommy.git

### Dependencies

Install all development dependencies via make

    make install

Alternatively you can simply run

    npm install
    bower install

### Build process

There are several grunt tasks for building an application.
For a straight forward process just run

    make build

Which installs and then builds all the necessary files

Alternatively when already installed all the dependencies run

    grunt build


## Development

During development just run

    grunt

which defaults to "grunt server".
It will run "grunt connect:server" and "grunt watch".


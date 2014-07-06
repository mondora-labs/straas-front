#straas-front

##Main components

AngularJS as front-end framework

Meteor as backend framework. (see
[loyall-back](https://bitbucket.org/loyall/loyall-back))

Asteroid as link between the two.

##How to set up the dev environment

Make sure you have `node` and `npm` installed. If you
haven't, I recommend installing them via
[homebrew](http://brew.sh/):

    brew install node

Then, install the dev dependencies for the project:

    cd /path/to/project/dir/
    npm install

For convenience's sake, you'll probably want to install some
of those dependencies as globally available command-line
utilities:

    npm install -g bower gulp karma

Then, install the app dependencies fro the project:

    bower install

You can now start the dev environment by running

    gulp dev

Each time you save a file in the `app` directory, `gulp`
will rebuild the project and refresh your browser page.

# About Forks

Forks of Wrot are always welcome. I love seeing people adapt and improve the plugin to fit their own workflows.

Wrot is released under the MIT license, so you are free to do whatever you like with it. If you plan to make your fork public, though, I would really appreciate your cooperation on a few points.

---

## Plugin name and ID

If you leave the ID unchanged, users cannot install both plugins in the same vault, and it gets tricky to tell which one is running. To make sure people can use both side by side, please make sure to give your fork a unique name and ID.

## Class names and CSS variables

If your class names, CSS variables, and the like are the same as the original's, unexpected bugs may occur when both are enabled. Rather than following the original, please give yours a prefix of your own.

## Version numbers

Matching upstream version numbers or jumping ahead makes it confusing to tell which build is newer and which version a user is talking about. I would really appreciate it if you could use your own numbering scheme instead.  
A clean way to handle this is to add a build tag to the upstream version, something like `3.1.0-fork.1`.

## Credits and descriptions

To keep users from confusing your fork with the official build, please make sure to clearly state somewhere in your README or description that it is a fork of Wrot.

## Bug reports

The issues page on the main repo is strictly for bugs in the official build. I cannot troubleshoot problems introduced by changes or new features in a fork, so please handle those bug reports on your own repository.

Thanks so much for your understanding and cooperation.

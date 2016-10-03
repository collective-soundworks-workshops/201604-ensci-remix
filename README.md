# ENSCI Remix

ENSCI Remix is a performance for three players that has been created during design workshop on collaborative motion-based mobile-web applications.

The application in based on the *Soundworks* framework (http://collective-soundworks.github.io/soundworks/).

## Installing the Server

The application requires `Node.js` (>= 0.12, <= 4.x).

Use the following sequence of commands to install the server:

```sh
$ git clone https://github.com/collective-soundworks-workshops/201604-ensci-remix.git ensci-remix
$ cd ensci-remix
$ npm install
```

## Running the Server

Use one of the following commands to run the server:

```sh
$ npm run watch
```

```sh
$ node server/index.js
```

```sh
$ node PORT=\<port\> server/index.js
```

## Clients

The application consists of two clients, the `display` and the `player`.
The `display` client hosts three audio players

The `display` client typically runs in a browser on the server machine using the following URL:
 - http://\<server address\>:\<port\>/display

The `player` client typically runs on a mobile device with the following URL:
 - http://\<server address\>:\<port\>/

Make sure that the Wi-Fi and network connection between the mobile clients, the server, and the display client is high bandwidth and not too busy.

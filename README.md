# Prudio Chat

## Connect your website to your Slack team

This is a product being built by the Assembly community. You can help push this idea forward by visiting [https://assembly.com/prudio](https://assembly.com/prudio).

### How Assembly Works

Assembly products are like open-source and made with contributions from the community. Assembly handles the boring stuff like hosting, support, financing, legal, etc. Once the product launches we collect the revenue and split the profits amongst the contributors.

Visit [https://assembly.com](https://assembly.com) to learn more.

## Repository

This repository is exclusive for the `chat.prud.io` part of the project.

It contains:

* The assets (CSS, fonts, sounds and images) of the client.
* The embeddable client script.
* The build script for client script (minimized and compressed).
* Handles the bridge to Slack Websocket.
* Handles the creation of channels in Slack and the counters.

Does not contain:

* **Database:** it will not work by itself has it does not contain the database migrations (included in the [backoffice repo](#soon)).

# Demo (TL;DR)

![Demo](http://g.recordit.co/UGeRPvWx3C.gif)

#Install

### Dependencies

* [Foreman](https://github.com/ddollar/foreman)
* [Grunt](http://gruntjs.com/)
* Node.js
* NPM

```
$ git clone https://github.com/asm-products/prudio-chat.git 
$ npm install
$ grunt build
```

To start your local server use:

```
$ foreman start
```

Open your browser at [localhost:5000/client-html](http://localhost:5000/client-html).

# Widget 

You can check the shipped example at [client-html/index.html](https://github.com/asm-products/prudio-chat/blob/master/client-html/index.html).

Or this quick example `index.html`:

```
<html>
	<head>
		<title>Prudio Test</title>
		<!-- your CSS and JS -->
	</head>
	
	<body>
		<h1>Some content</h1>
	</body>
	
	<!-- PRUDIO START HERE -->
	<script src="/client.local.js?token=xxx" async></script>
	<script>
  		// OPTIONAL
      	window._PrudioSettings = {
        	title: 'Prudio Support',
        	/*
        	name: 'John',
        	email: 'john@prud.io',
        	buttonSelector: '#merda',
        	buttonColor: 'green',
        	*/
      	};
	</script>
	<!-- PRUDIO /END -->
</html>
```

You can check all the `window._PrudioSettings` settings at [docs.prud.io](http://docs.prud.io) (soon) website.

# Contributing

**Note:** contributions to this project will only be accepted if they reference a design task in the respective project on [Assembly](https://assembly.com/prudio) or fix a bug or an issue.

Have a look at existing projects and tasks or start a discussion about what you’d like to be working on - you can do that on the [Assembly](https://assembly.com/prudio) project page.

1. [Create a Task](https://assembly.com/prudio/bounties/new) that describes what you want to do. This gives others the opportunity to help and provide feedback.
2. Fork the repo
3. Create your feature branch git checkout -b my-new-feature
4. Commit your changes git commit -am 'Add some feature’
5. Push to the branch git push origin my-new-feature
6. Create new Pull Request which references the Task number.

We will accept patches that:

* Don’t break existing functionality.
* Are well documented and commented.
* Are written in strict Javascript only (no Coffeescript, sorry)

# Issues

Please use the GitHub issues or chat with us at [Assembly](https://assembly.com/chat/prudio)

# Know issues

### Stoping foreman

When doing `CTRL + C` in Foreman the Node.js process does not exit.

This happens because of Socket.io opens a persistent connection to the server and Foreman cannot exit. Try doing `killall node`.

# License

[AGPL v3](https://github.com/asm-products/prudio-chat/blob/master/LICENSE).
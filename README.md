# Prudio

## Connect your website to your Slack team

This is a product being built by the Assembly community. You can help push this idea forward by visiting [https://assembly.com/prudio](https://assembly.com/prudio).

### How Assembly Works

Assembly products are like open-source and made with contributions from the community. Assembly handles the boring stuff like hosting, support, financing, legal, etc. Once the product launches we collect the revenue and split the profits amongst the contributors.

Visit [https://assembly.com](https://assembly.com) to learn more.

# Demo

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

You can check the shipped example at [client-html/index.html](https://github.com/PrudioHQ/prudio-irc/blob/master/client-html/index.html).

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

# Issues

Please use the GitHub issues or chat with us at [Assembly](https://assembly.com/chat/prudio)

# Know issues

### Stoping foreman

When doing `CTRL + C` in Foreman the Node.js process does not exit.

This happens because of Socket.io opens a persistent connection to the server and Foreman cannot exit. Try doing `killall node`.

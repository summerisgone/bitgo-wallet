# Development guide

## Structure

Application consists of few abstraction types.

 * Registry of observables (``connection.js``)
 * Observable subjects, "connection plugins" in ``plugins.js``
 * React "smart" components in ``app.js``
 * View components in ``*.jsx`` files

## Observables concept

### Observables

The reason why observables appeared is my willing to use dependency injection for the data. For example
> I want to subscribe on current user information, I don't care if I'm authorised or not. Just execute my callback when you will have information about current user.

or 

> Here's my method, call it when my session expires.

So far so good, [Rx.js](reactivex.io/rxjs/manual/index.html) provdes good toolbelt for describing that. You can't just use promises, because Promise resolves only once, but data might changes many times during all application lifecycle.

### Plugins

Each "plugin" must provide an object with [Observable contract](https://github.com/tc39/proposal-observable). Registry instantiates each plugin only once, and store them in the ``connection.plugins[pluginName]`` object.

For example, SDK plugin provides [BitGo API](https://www.bitgo.com/api/) wrapper. Token plugin provides authorization token. You can combine them and re-instantiate SDK each time token changes:

```javascript
const token = conn.inject('token');
return token.map(t => {
	return new conn.options.BitGo({accessToken: t});
})
```

### publishReplay().refCount() magic

Sometimes you want to share value from observable between multiple subscribers. That's called ["multicast"](reactivex.io/rxjs/manual/overview.html#multicasted-observables) in rx terms. This combination allows you two things:

* ``publishReplay`` allows to get last value from stream when you've just subscribed
* ``refCount`` counts subscribers and don't execute map functions when there are no listeners.


```javascript
it('provides last value', done => {
  const source = new rx.Subject();
  const newSubj = source.publishReplay().refCount();
  newSubj.subscribe(() => {}); // connect to observable
  source.next(0);
  newSubj.subscribe(v => {
    assert(v === 0);
    done();
  });
});

it('works as multicast', done => {
  const source = new rx.Subject();
  const spy = sinon.spy();
  const replaySubj = source.map(v => {
    spy();
    return v;
  }).publishBehavior().refCount();
  replaySubj.subscribe(() => {});
  replaySubj.subscribe(() => {});
  replaySubj.subscribe(() => {});
  source.next('foo');
  setTimeout(() => {
    assert.equal(spy.callCount, 1);
    done();
  });
});
```

### Testability

Since general logic can be described in observable terms, you don't need browser environment like PhantomJS to run tests. So tests run faster and more predictable.

To inspect tests, take a look at ``test/plugins.spec.js``. Run them with [mocha test framework](https://mochajs.org/):

```bash
$ mocha src/test
```

## React smart and dumb components

Since 0.14 React introduced [stateless components](https://medium.com/@joshblack/stateless-components-in-react-0-14-f9798f8b992d). They are implemented as fucntions rather than classes and have only ``props``.

```javascript
View.propTypes = {
    name: React.PropTypes.string
};
function View(props) {
    return (
        <div className="ui vertical segment">
            Hello {props.name}!
        </div>
    );
}
module.exports = View;
```

So logic is encapsulated in ``React.Component`` descendants, view and markup goes to "functional-style" components.

If you need to pass some actions from view, consider passing handler from parent component:

```javascript
function MyForm(props) {
	return <form onSubmit={props.handler}>...</form>;
}
class App {
	submitHandler(e) {
    	e.preventDefault();
    	// ...
    }
	render() {
    	<div>
        	<MyForm handler={this.submitHandler.bind(this)} />
        </div>
    }
}
```

## Reference

* [RxJS v5](http://reactivex.io/rxjs/) for data observables
* [Semantic UI](http://semantic-ui.com/) as css framework
* [React](https://facebook.github.io/react/) as js framework
* [Webpack](https://webpack.js.org/) for build everything
* [Mocha](https://mochajs.org/) test framework
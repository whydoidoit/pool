### Introduction

A generic object pooling function that provides scratch objects either in a looped buffer mode
or with the concept of "reservation" should the function requiring them be async. This is 
primarily trading memory for a reduction in garbage collection, which is useful for games,
but should be used with care. 

### Installation

```language-shell
npm install --save temporary-object-pooling
```

### Usage

```language-javascript

import Pool from 'temporary-object-pooling'

//Create a pool of 200 arrays, reset the length of the array when
//retrieving
let myPool = new Pool(()=>[], array=>array.length = 0, 200);

//Create a pool of 1000 vectors, reset them to 0 on access
let myVectorPool = new Pool(()=>new pc.Vec3, vector=>vector.copy(pc.Vec3.ZERO), 1000);

...

// Get a scratch array, no protection is given for this
// overrunning if more than 200 arrays are allocated
// before this array is no longer needed

let scratchArray = myPool.get();
scratchArray.push(something);
return scratchArray;

// Get a vector and initialise some of its attributes

let myVector = myVectorPool.get("x", 1, "y", 2);
return myVector;

// Reserve 2 vectors for use
myVectorPool.provide(2, (v1, v2)=>{
    v1.copy(someValue);
    v2.copy(someOtherValue);
    return someAsyncFunction(v1).then(result=>{
        v2.add(result).sub(v1);
        return v2
    });
}).then(vectorResult=>{
    //vectorResult is still valid but no longer reserved!
    ... 
})


```

### Parameters

`new Pool([constructor], [reset], [size])`

`constructor` a function returning the type of object required, if omitted a blank object is returned

`reset` a function that takes the pooled item and resets it to some state, if omitted the object is not reset

`size` the initial size of the pool, defaults to 1024.  Only reserving items will increase the pool size, 
otherwise it rolls around.

### Methods

`pool.get([key,value], ...)`

Get a scratch instance and optionally initialize it with key value pairs.

`pool.provide(number, callback)`

Provide a number of pool items to the callback, these are reserved until the callback returns.
If it's a promise then they are reserved until the promise is resolved or rejected.

The `callback` is provided with a number of parameters matching the number of items requested. 

The pool size is increased if there are not enough items to satisfy the request.  Pool items provided
deplete the pool available for normal scratch items. The minimum size of the pool is 25% of the requested
size under these circumstances.

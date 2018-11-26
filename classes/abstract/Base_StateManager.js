class Base_StateManager {

    constructor() {
      if (this.constructor == Base_StateManager) {
        throw new Error("Can't initiate an abstract class! Please extend this base class.");
      }
    }
  
    update() {
      throw new Error('You need to implement an update() function');
    }

    getState() {
      throw new Error('You need to implement a getState() function. It need to return an integer representing the last action position.');
    }
  
}

module.exports = {
    Base_StateManager
};
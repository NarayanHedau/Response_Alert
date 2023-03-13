class ArrayUtils  {
  INDEX_NOT_FOUND= -1

  addAll(array1, ...array2) {
    if (!array1) {
      return this.clone(array2);
    } else if (!array2) {
      return this.clone(array1);
    }
    const type1 = array1.constructor.name;
    const joinedArray = new Array(array1.length + array2.length);
    joinedArray.splice(0, 0, ...array1);
    try {
      joinedArray.splice(array1.length, 0, ...array2);
    } catch (error) {
      if (!(type1.includes(array2.constructor.name))) {
        throw new Error(`Cannot store ${array2.constructor.name} in an array of ${type1}`);
      }
      throw error;
    }
    return joinedArray;
  }

  addAllByte(array1, ...array2) {
    if (!array1) {
      return this.clone(array2);
    } else if (!array2) {
      return this.clone(array1);
    }
    const joinedArray = new Array(array1.length + array2.length);
    joinedArray.splice(0, 0, ...array1);
    joinedArray.splice(array1.length, 0, ...array2);
    return joinedArray;
  }

  addByte(array, element) {
    const newArray = [...array, element];
    return newArray;
  }

  add(array, element) {
    let type;
    if (array) {
      type = array.constructor.name;
    } else if (element) {
      type = element.constructor.name;
    } else {
      throw new Error("Arguments cannot both be null");
    }
    const newArray = [...array, element];
    return newArray;
  }

  clone(array) {
    return array ? [...array] : null;
  }

  indexOf(array, objectToFind, startIndex = 0) {
    if (!array) {
      return this.INDEX_NOT_FOUND;
    }
    return array.indexOf(objectToFind, startIndex);
  }

  lastIndexOf(array, objectToFind) {
    return this.lastIndexOf(array, objectToFind, array.length - 1);
  }

  lastIndexOf(array, objectToFind, startIndex) {
    if (!array) {
      return this.INDEX_NOT_FOUND;
    }
    for (let i = startIndex; i >= 0; i--) {
      if (array[i] === objectToFind) {
        return i;
      }
    }
    return this.INDEX_NOT_FOUND;
  }

}

Array.prototype.distinct = function(key) {
  var result = [];
  for(var i = 0; i < this.length; i++) {
    if(this[i].hasOwnProperty(key)) {
      if(result.indexOf(this[i][key]) < 0) {
        result.push(this[i][key]);
      }
    }
  }
  return result;
}
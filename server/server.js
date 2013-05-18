Documents.allow({
  insert: function() {
    return Meteor.userId() !== null;
  }, 
  update: function() {
    return true;
  }
});

Updates.allow({
  insert: function(userId, doc) {
    var length = Updates.find({owner: userId, document_id: doc.document_id}).count();
    return length == 0 && doc.owner == userId;
  }, 
  update: function(userId, doc) {
    return doc.owner == userId;
  }
});

Meteor.publish("participants", function(documentId) {
  return Updates.distinct("owner", {document_id: documentId});
});

Meteor.publish("updates", function(documentId) {
  return Updates.find({document_id: documentId});
});

Meteor.methods({
  createDocument: function() {
    var documentId = Documents.insert({});
    // Insert an update for document founder
    Updates.insert({owner: this.userId, document_id: documentId, update_data: {}});
    return documentId;
  }, 
  createUpdate: function(documentId, updateData) {
    updateData = updateData || {};
    var updateId = Updates.insert({owner: this.userId, document_id: documentId, update_data: updateData});
    return updateId;
  }
})

Meteor.startup(function() {
  Documents.remove({});
  Updates.remove({});
});
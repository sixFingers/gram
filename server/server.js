Documents = new Meteor.Collection("documents");

Documents.allow({
  update: function() {
    return true;
  }
});

Meteor.publish("documents", function() {
  return Documents.find();
});

Meteor.startup(function() {
  Documents.remove({});
  Documents.insert({content: "Lorem ipsum"});
});
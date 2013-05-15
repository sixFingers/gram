Documents = new Meteor.Collection("documents");

Meteor.publish("documents", function() {
  return Documents.find();
});

Meteor.startup(function() {
  Documents.remove({});
  Documents.insert({content: "Lorem ipsum"});
});
Documents = new Meteor.Collection("documents");
var codeMirror = false;

Meteor.subscribe("documents");

Deps.autorun(function() {
  var codeDocument = Documents.findOne();
  if(codeDocument) {
    Session.set("document_id", codeDocument._id);
    codeMirror.setValue(codeDocument.content);
  }
});

Meteor.startup(function() {
  console.log(Meteor.user());
  codeMirror = CodeMirror(document.body, {
    mode: "javascript"
  });

  codeMirror.on("change", function(codemirror, change) {
    Session.set("document_content", codemirror.getValue());
    Documents.update(Session.get("document_id"), {$set: {content: codemirror.getValue()}});
  });
});
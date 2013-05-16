var router, 
    codeMirror;

Deps.autorun(function() {
  var document_id = Session.get("document_id");
  if(document_id) {
    Meteor.subscribe("updates", document_id);
    var updates = Updates.find().fetch();
    if(updates.length > 0) {
      var participants = _.pluck(updates, "owner");
      if(participants.indexOf(Meteor.userId()) < 0) {
        Meteor.call("createUpdate", document_id);
      }
    }
  }
});

/*=============================
=            Router           =
=============================*/

var Workspace = Backbone.Router.extend({
  routes: {
    "": "default", 
    ":documentId": "document"
  }, 
  currentPage: false, 
  default: function() {
    this.currentPage = "default";
  }, 
  document: function(documentId) {
    this.currentPage = "version";
    Session.set("document_id", documentId);
  }
});

/*=============================
=            Views            =
=============================*/

var WorkspaceView = Backbone.View.extend({
  el: "body", 
  events: {
    "click #default": "default", 
    "click #share": "shareDocument"
  }, 
  default: function(e) {
    e.preventDefault();
    router.navigate("/", {trigger: true});
  }, 
  shareDocument: function(e) {
    e.preventDefault();
    if(!Session.get("document_id")) {
      Meteor.call("createDocument", function(error, documentId) {
        Session.set("document_id", documentId);
        router.navigate(documentId);
      });
    }
  }
});

/*=================================
=            Templates            =
=================================*/

Template.participants.participants = function() {
  var uids = _.pluck(Updates.find({document_id: Session.get("document_id")}).fetch(), "owner");
  for(var u = 0; u < uids.length; u++) {
    uids[u] = {uid: uids[u]};
  }
  return uids.length > 0 ? uids: false;
};

/*===============================
=            Startup            =
===============================*/

Meteor.startup(function() {
  // Routing
  function setup() {
    router = new Workspace();
    view = new WorkspaceView();
    Backbone.history.start({pushState: true});
  }
  
  // Login
  if(!Meteor.userId()) {
    Accounts.createUser({
      anonymous: 1, 
      username: Random.id(), 
      password: Random.id()
    }, function() {
      if(arguments.length == 0) {
        setup();
      } else {
        console.log("Errors logging in.");
      }
    });
  } else {
    setup();
  }

  // Create/read a document
  // codeMirror = CodeMirror(document.getElementById("main"), {
  //   mode: "javascript", 
  //   lineNumbers: true, 
  //   theme: "monokai"
  // });

  // codeMirror.on("change", function(codemirror, change) {
  //   Session.set("document_content", codemirror.getValue());
  //   Documents.update(Session.get("document_id"), {$set: {content: codemirror.getValue()}});
  // });
});


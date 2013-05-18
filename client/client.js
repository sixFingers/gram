Session.set("participants", []);

Gram = {
  router: null, 
  codeMirror: null, 
  participants: []
}

Deps.autorun(function() {
  var document_id = Session.get("document_id");
  if(document_id) {
    Meteor.subscribe("updates", document_id);
    var updates = Updates.find().fetch();
    if(updates.length > 0) {
      // Gram.participants = updates.distinct("owner");
      Session.set("participants", updates.distinct("owner"));
      if(Session.get("participants").indexOf(Meteor.userId()) < 0) {
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
    Session.set("document_id", null);
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
    Gram.router.navigate("/", {trigger: true});
  }, 
  shareDocument: function(e) {
    e.preventDefault();
    if(!Session.get("document_id")) {
      Meteor.call("createDocument", function(error, documentId) {
        Session.set("document_id", documentId);
        Gram.router.navigate(documentId);
      });
    }
  }
});

/*=================================
=            Templates            =
=================================*/

Template.participants.participants = function() {
  return Session.get("participants");
};

/*===============================
=            Startup            =
===============================*/

Meteor.startup(function() {
  // Routing
  function setup() {
    Gram.router = new Workspace();
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
  Gram.codeMirror = CodeMirror(document.getElementById("main"), {
    mode: "javascript", 
    lineNumbers: true, 
    theme: "monokai"
  });

  Gram.codeMirror.on("change", function(codemirror, change) {
    if(Session.get("document_id")) {
      Meteor.call("createUpdate", Session.get("document_id"), change);
    }
  });
});

/*=========================================
=            Updates rendering            =
=========================================*/

var recentUpdates = Updates.find().observeChanges({
  added: function(id, change) {
    if(change.owner != Meteor.userId()) {
      console.log("New change", id, change);  
    }
  }
});
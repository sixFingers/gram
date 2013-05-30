Session.set("participants", []);

Gram = {
  router: null, 
  view: null, 
  codeMirror: null, 
  participants: [], 
  mirrors: {}
}

Deps.autorun(function() {
  var document_id = Session.get("document_id");
  if(document_id) {
    Meteor.subscribe("updates", document_id);
    var updates = Updates.find().fetch();
    if(updates.length > 0) {
      // Set participants list
      Session.set("participants", updates.distinct("owner"));

      // Ping the list to let others know we're connected
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
    Gram.view.setMode();
  }, 
  document: function(documentId) {
    this.currentPage = "version";
    Session.set("document_id", documentId);
    Gram.view.setMode("pair");
  }
});

/*=============================
=            Views            =
=============================*/

var WorkspaceView = Backbone.View.extend({
  el: "body", 
  events: {
    "click #default": "default", 
    "click #share": "shareDocument", 
    "click a.participant": "switchParticipant"
  }, 
  editors: {}, 
  initialize: function() {
    this.editors.owner = CodeMirror($("#owner")[0], {
      mode: "javascript", 
      lineNumbers: true, 
      theme: "monokai"
    });

    // Store client owner codemirror document
    Gram.mirrors[Meteor.userId()] = this.editors.owner.getDoc();

    // If a saved version exists from previous session, restore it
    if(localStorage.getItem("documentCache")) {
      Gram.mirrors[Meteor.userId()].setValue(localStorage.getItem("documentCache"));
      localStorage.removeItem("documentCache");
    }

    this.editors.owner.on("change", function(codemirror, change) {
      if(Session.get("document_id")) {
        Meteor.call("createUpdate", Session.get("document_id"), change);
      }
    });
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
        Gram.router.navigate(documentId, {trigger: true});
      });
    }
  }, 
  setMode: function(mode) {
    $("#divider, #participant").hide();
    
    if(this.editors.participant) {
      $(this.editors.participant.getWrapperElement()).remove();
      delete this.editors.participant;  
    }
    
    if(mode == "pair") {
      $("#divider, #participant").show();
      this.editors.participant = CodeMirror($("#participant")[0], {
        mode: "javascript", 
        lineNumbers: true, 
        readOnly: true, 
        theme: "monokai"
      });
    }
  }, 
  switchParticipant: function(e) {
    var pairId = $(e.currentTarget).attr("rel");
    $("#participant .username span").text(pairId);
    this.editors.participant.swapDoc(Gram.mirrors[pairId]);
  }
});

/*=================================
=            Templates            =
=================================*/

Template.participants.participants = function() {
  return _.without(Session.get("participants"), Meteor.userId());
};

/*===============================
=            Startup            =
===============================*/

Meteor.startup(function() {
  // Routing
  function setup() {
    Gram.router = new Workspace();
    Gram.view = new WorkspaceView();
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
});

/*=========================================
=            Updates rendering            =
=========================================*/

var recentUpdates = Updates.find().observeChanges({
  added: function(id, change) {
    if(change.owner != Meteor.userId()) {
      if(change.update_data.from && change.update_data.to && change.update_data.text) {
        // Create new Codemirror Doc for this change's owner, if needed
        Gram.mirrors[change.owner] = Gram.mirrors[change.owner] || CodeMirror.Doc("", "javascript");
        // Apply the change
        Gram.mirrors[change.owner].replaceRange(change.update_data.text[0], change.update_data.from, change.update_data.to);
      }
    } else {
      localStorage.setItem("documentCache", Gram.mirrors[Meteor.userId()].getValue());
    }
  }
});
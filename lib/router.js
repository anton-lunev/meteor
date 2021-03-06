Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
    notFoundTemplate: 'notFound',
    waitOn: function () {
        return Meteor.subscribe('notifications');
    }
});

PostsListController = RouteController.extend({
    template: 'postsList',
    increment: 5,
    postsLimit: function () {
        return parseInt(this.params.postsLimit) || this.increment;
    },
    findOptions: function () {
        return {sort: this.sort, limit: this.postsLimit()};
    },
    subscriptions: function () {
        this.postsSub = Meteor.subscribe('posts', this.findOptions());
    },
    posts: function () {
        console.log(this.findOptions());
        return Posts.find({}, this.findOptions());
    },
    data: function () {
        var posts = this.posts();
        var hasMore = posts.count() === this.postsLimit();
        return {
            posts: posts,
            ready: this.postsSub.ready,
            nextPath: hasMore ? this.nextPath() : null
        };
    }
});

NewPostsController = PostsListController.extend({
    sort: {submitted: -1, _id: -1},
    nextPath: function () {
        return Router.routes.newPosts.path({postsLimit: this.postsLimit() + this.increment})
    }
});

BestPostsController = PostsListController.extend({
    sort: {votes: -1, submitted: -1, _id: 1},
    nextPath: function () {
        return Router.routes.bestPosts.path({postsLimit: this.postsLimit() + this.increment})
    }
});

Router.map(function () {
    this.route('home', {
        path: '/',
        controller: NewPostsController
    });
    this.route('newPosts', {
        path: '/new/:postsLimit?',
        controller: NewPostsController
    });
    this.route('bestPosts', {
        path: '/best/:postsLimit?',
        controller: BestPostsController
    });

    this.route('postPage', {
        path: '/posts/:_id',
        waitOn: function () {
            return [
                Meteor.subscribe('singlePost', this.params._id),
                Meteor.subscribe('comments', this.params._id)
            ];
        },
        data: function () {
            return Posts.findOne(this.params._id);
        }
    });
    this.route('postEdit', {
        path: '/posts/:_id/edit',
        waitOn: function () {
            return Meteor.subscribe('singlePost', this.params._id);
        },
        data: function () {
            return Posts.findOne(this.params._id);
        }
    });

    this.route('postSubmit', {
        path: '/submit',
        disableProgress: true
    });
});

var requireLogin = function () {
    if (!Meteor.user()) {
        if (Meteor.loggingIn()) {
            this.render(this.loadingTemplate);
        } else {
            this.render('accessDenied');
        }
    } else {
        this.next();
    }
};

Router.onBeforeAction('loading');
Router.onBeforeAction('dataNotFound', {only: 'postPage'});
Router.onBeforeAction(requireLogin, {only: 'postSubmit'});
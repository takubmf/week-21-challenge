const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User
                    .findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('books');
                return userData;
            }
            throw new AuthenticationError('Not logged in');
        },
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            // This if statement checks to see if the user had put in the wrong credentials
            if(!user) throw new AuthenticationError('You got the wrong credentials, figure it out');

            const correctPw = await user.isCorrectPassword(password);

            // This if statement checks to see if the user has a incorrect password
            if(!correctPw) throw new AuthenticationError('Sorry not sorry, wrong password');

            const token = signToken(user);
            return { token, user };
        },

        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { bookData }, context) => {
            if(context.user) {
                const updatedUser = await User
                .findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: bookData } },
                    { new: true }
                )
                .populate('books');

                return updatedUser;
            }
            throw new AuthenticationError('You gotta be logged in!');
        },
        removeBook: async (parent, { bookId }, context) => {
            if(context.user) {
                const updatedUser = await User
                .findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('You gotta be logged in!');
        }
    }
};

module.exports = resolvers;
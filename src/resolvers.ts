import { GraphQLError } from 'graphql';

export const resolvers = {
    Query: {
        async player(parent, args) {
            return { "playerId": args.playerId };
        },

        async players(parent, args, contextValue) {
            const idents = await contextValue.dataSources.ds.getPlayers(args.firstName, args.lastName);
            return idents.map((i) => { 
                return { "playerId": i };
            });
        },

        async lineup(parent, args, contextValue) {
            return await contextValue.dataSources.ds.getLineup(args.lineupId);
        }
    },

    Mutation: {
        async lineup(parent, args, contextValue) {
            let lineupId = args.lineupId;
            if(lineupId == null) {
                const result = await contextValue.dataSources.ds.createLineup();
                lineupId = result.lineupId;
            }

            return await contextValue.dataSources.ds.updateLineup(lineupId, args);
        }
    },

    Player: {
        async profile(parent, args, contextValue) {
            const result = await contextValue.dataSources.ds.getProfile(parent.playerId);
            if(result == null) {
                throw new GraphQLError(
                    "No player found", { extensions: { code: "BAD_USER_INPUT" } }
                );
            }
            return result;
        },

        async stats(parent, args, contextValue) {
            const result = await contextValue.dataSources.ds.getStats(parent.playerId);
            if(result == null) {
                throw new GraphQLError(
                    "No player found", { extensions: { code: "BAD_USER_INPUT" } }
                );
            }
            return result;
        },
    }
};


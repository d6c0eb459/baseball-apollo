export const typeDefs = `
    type Query {
        player(playerId: String!): Player
        players(firstName: String!, lastName: String!): [Player]!
        lineup(lineupId: Int!): Lineup
    }

    type Player {
        playerId: String!
        profile: Profile!
        stats: Stats!
    }

    type Profile {
        name: String!
        country: String!
        year: Int!
    }

    type Stats {
        atBats: Int!
        homeRuns: Int!
        hits: Int!
        strikeouts: Int!
        battingAverage: Float!
        sluggingPercentage: Float!
    }

    type Mutation {
        lineup(
            lineupId: Int,
            pitcher: String,
            catcher: String,
            firstBase: String,
            secondBase: String,
            thirdBase: String,
            shortstop: String,
            leftField: String,
            centerField: String,
            rightField: String
        ): Lineup
    }

    type Lineup {
        lineupId: Int
        average: Stats
        pitcher: Player
        catcher: Player
        firstBase: Player
        secondBase: Player
        thirdBase: Player
        shortstop: Player
        leftField: Player
        centerField: Player
        rightField: Player
    }
`;

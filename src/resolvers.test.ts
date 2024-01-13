import { ApolloServer } from "@apollo/server";
import assert from "node:assert";

import { connect } from "./database";
import { DataSource } from "./datasource";

import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";

interface ContextValue {
    dataSources: {
        ds: DataSource;
    };
}

describe('resolver tests', () => {
    let ds;
    let testServer;

    beforeAll(async () => {
        const db = await connect(
            ":memory:",
            async (db) => {
                let data = [
                    ["1", "Andy", "Anderson", 2000, "CAN"],
                    ["2", "Bob", "Ball", 2001, "CAN"],
                    ["3", "Bill", "Baker", 2002, "USA"],
                    ["4", "Charlie", "Cho", 2003, "CAN"],
                ]

                await Promise.all(data.map((row) => {
                    return db.run("INSERT INTO 'People' VALUES(?, ?, ?, ?, ?)", row);
                }));

                data = [
                    ["1", 10, 20, 2, 2, 3, 4],
                    ["1", 90, 21, 3, 8, 7, 6],
                    ["2", 50, 22, 3, 6, 7, 8],
                    ["3", 10, 23, 4, 2, 3, 4],
                    ["3", 10, 24, 2, 2, 3, 4],
                    ["3", 10, 23, 3, 2, 3, 4],
                    ["4", 50, 22, 2, 6, 7, 8],
                ]

                await Promise.all(data.map((row) => {
                    return db.run("INSERT INTO 'Batting' VALUES(?, ?, ?, ?, ?, ?, ?)", row);
                }));
            }
        );

        ds = new DataSource(db);

        testServer = new ApolloServer<ContextValue>({
            typeDefs,
            resolvers,
        });

    });

	test("search for players by name", async () => {
        const response = await testServer.executeOperation({
            query: 'query { players(firstName: "B", lastName: "B") { playerId } }',
        }, { contextValue: { dataSources: { ds: ds } } } );
        
        assert(response.body.kind === "single");
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.players).toEqual(
            [{ "playerId": "3" }, { playerId: "2" }]
        );
    });

	test("search for players no results", async () => {
        const response = await testServer.executeOperation({
            query: 'query { players(firstName: "Zz", lastName: "Zz") { playerId } }',
        }, { contextValue: { dataSources: { ds: ds } } } );

        assert(response.body.kind === "single");
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.players).toEqual([]);
    });

	test("load player profile", async () => {
        const response = await testServer.executeOperation({
            query: `query { 
                player(playerId: "1") {
                    profile {
                        name
                        country
                        year
                    }
                }
            }
            `
        }, { contextValue: { dataSources: { ds: ds } } } );
        
        assert(response.body.kind === "single");
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.player).toEqual(
            { "profile": {"country": "CAN", "name": "Andy Anderson", "year": 2000 }  }
        );

    });

	test("load player stats", async () => {
        const response = await testServer.executeOperation({
            query: `query { 
                player(playerId: "1") {
                    stats {
                        homeRuns
                    }
                }
            }
            `
        }, { contextValue: { dataSources: { ds: ds } } } );
        
        assert(response.body.kind === "single");
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.player).toEqual(
            { "stats": {"homeRuns": 10 }  }
        );

    });

	test("load non existing player", async () => {
        const response = await testServer.executeOperation({
            query: `query { 
                player(playerId: "-1") {
                    profile {
                        name
                    }
                }
            }
            `
        }, { contextValue: { dataSources: { ds: ds } } } );
        
        assert(response.body.kind === "single");
        expect(response.body.singleResult.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ "extensions": { "code": "BAD_USER_INPUT" } })
            ])
        );
    });

	test("search for stats by name", async () => {
        const response = await testServer.executeOperation({
            query: `query { 
                players(firstName: "B", lastName: "B") {
                    profile {
                        name
                    }
                    stats {
                        atBats
                    }
                }
            }
            `
        }, { contextValue: { dataSources: { ds: ds } } } );
        
        assert(response.body.kind === "single");
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.players).toEqual(
            [
                { "profile": { name: "Bill Baker" }, "stats": { "atBats": 30 } },
                { "profile": { name: "Bob Ball" }, "stats": { "atBats": 50 } }
            ]
        );
    });

	test("create lineup", async () => {
        const response = await testServer.executeOperation({
            query: `mutation { 
                lineup {
                    lineupId
                }
            }
            `
        }, { contextValue: { dataSources: { ds: ds } } } );
        
        assert(response.body.kind === "single");
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.lineup).toEqual(
            { 
                "lineupId": expect.any(Number)
            }
        );
    });

	test("modify lineup", async () => {
        let response = await testServer.executeOperation({
            query: `mutation { 
                lineup {
                    lineupId
                    pitcher {
                        playerId
                    }
                    catcher {
                        playerId
                    }
                }
            }
            `
        }, { contextValue: { dataSources: { ds: ds } } } );
        
        assert(response.body.kind === "single");
        expect(response.body.singleResult.errors).toBeUndefined();

        const lineupId = response.body.singleResult.data.lineup.lineupId;

        response = await testServer.executeOperation({
            query: `mutation { 
                lineup(lineupId: ${lineupId}, pitcher: "1") {
                    lineupId
                    pitcher {
                        playerId
                    }
                    catcher {
                        playerId
                    }
                }
            }
            `
        }, { contextValue: { dataSources: { ds: ds } } } );

        assert(response.body.kind === "single");
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.lineup).toEqual(
            { 
                "lineupId": lineupId,
                "catcher": null, 
                "pitcher": { "playerId": "1" }
            }
        );
    });

	test("query lineup", async () => {
        const response = await testServer.executeOperation({
            query: `mutation { 
                lineup(pitcher: "1") {
                    pitcher {
                        profile {
                            name
                        }
                        stats {
                            battingAverage
                        }
                    }
                }
            }
            `
        }, { contextValue: { dataSources: { ds: ds } } } );
        
        assert(response.body.kind === "single");
        expect(response.body.singleResult.errors).toBeUndefined();
        expect(response.body.singleResult.data?.lineup).toEqual(
            { 
                "pitcher": {
                    "profile": {
                        "name": "Andy Anderson"
                    },
                    "stats": {
                        "battingAverage": 0.1
                    }
                }
            }
        );
    });
});

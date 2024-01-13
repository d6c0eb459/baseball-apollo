/**
 * Tests for the database module.
 */
import { connect, Database } from "./database";

describe('database tests', () => {
    let db: Database;

    /**
     * Test setup, see database.ts for schema.
     */
    beforeAll(async () => {
        db = await connect(
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
    });

	test("search for players by name", async () => {
        let result = await db.getPlayers("B", "B");
        expect(result).toEqual(["3", "2"]);

        result = await db.getPlayers("Andy", "A");
        expect(result).toEqual(["1"]);

        result = await db.getPlayers("Z", "Z");
        expect(result).toHaveLength(0);
	});

	test("get player profiles", async () => {
        const result = await db.getProfiles(["3", "1"]);
        expect(result).toEqual([
            {
              "country": "USA",
              "name": "Bill Baker",
              "year": 2002,
            },
            {
              "country": "CAN",
              "name": "Andy Anderson",
              "year": 2000,
            },
        ]);
	});

	test("get unknown player profile", async () => {
        const result = await db.getStats(["-1"]);
        expect(result).toEqual([null]);
    });

	test("get player stats", async () => {
        const result = await db.getStats(["2", "1"]);
        expect(result).toEqual([
            {
              "atBats": 50,
              "battingAverage": 14 / 100,
              "hits": 7,
              "homeRuns": 6,
              "slugging": 106 / 100,
              "strikeouts": 8,
            },
            {
              "atBats": 100,
              "battingAverage": 10 / 100,
              "hits": 10,
              "homeRuns": 10,
              "slugging": 91 / 100,
              "strikeouts": 10,
            },
        ]);
	});

	test("get unknown player stats", async () => {
        const result = await db.getStats(["-1"]);
        expect(result).toEqual([null]);
    });

	test("create lineup", async () => {
        const result = await db.createLineup();
        expect(result).toEqual({
            "lineupId": expect.any(Number),
            "catcher": null,
            "centerField": null,
            "firstBase": null,
            "leftField": null,
            "pitcher": null,
            "rightField": null,
            "secondBase": null,
            "shortstop": null,
            "thirdBase": null
        });
    });

	test("update lineup", async () => {
        let result = await db.createLineup();
        const lineupId = result.lineupId;

        result = await db.updateLineup(lineupId, {
            "pitcher": "1", // Andy
            "catcher": "Bill B",
            "shortstop": "B", // Bob
            "firstBase": "z",
            "secondBase": "zz zz",
        });

        expect(result).toEqual({
            "lineupId": lineupId,
            "catcher": { "playerId": "3" },
            "centerField": null,
            "firstBase": null,
            "leftField": null,
            "pitcher": { "playerId": "1" },
            "rightField": null,
            "secondBase": null,
            "shortstop": { "playerId": "2" },
            "thirdBase": null
        });
    });

	test("update non existing lineup is a noop", async () => {
        const result = await db.updateLineup(-1, {
            "pitcher": "1",
        });

        expect(result).toEqual({
            "lineupId": expect.any(Number),
            "catcher": null,
            "centerField": null,
            "firstBase": null,
            "leftField": null,
            "pitcher": null,
            "rightField": null,
            "secondBase": null,
            "shortstop": null,
            "thirdBase": null
        });
    });
});

const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("End Voting Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let decide = blockchain.createAccount("telos.decide");

    beforeAll(async () => {
        telosworks.setContract(blockchain.contractTemplates[`telosworks`]);
        telosworks.updateAuth(`active`, `owner`, {
        accounts: [
            {
            permission: {
                actor: telosworks.accountName,
                permission: `eosio.code`
            },
            weight: 1
            }
        ]
        });

        decide.setContract(blockchain.contractTemplates["telos.decide"]);

        decide.updateAuth(`active`, `owner`, {
        accounts: [
            {
            permission: {
                actor: decide.accountName,
                permission: `eosio.code`
            },
            weight: 1
            }
        ]
        });
    });

    beforeEach(async () => {
        telosworks.resetTables();
        decide.resetTables();

        await decide.loadFixtures();
        await decide.loadFixtures("ballots", {
            "telos.decide": [{
                ballot_name: 'ballot',
                category: 'leaderboard',
                publisher: 'telosworks',
                status: 'voting',
                title: 'Title',
                description: 'Description',
                content: 'Content',
                treasury_symbol: '4,VOTE',
                voting_method: '1token1vote',
                min_options: 1,
                max_options: 1,
                options: [{key: "", value: "350.0000 VOTE"}, {key: "............1", value: "400.0000 VOTE"}, {key: "............2", value: "345.0000 VOTE"}],
                total_voters: 0,
                total_delegates: 0,
                total_raw_weight: '0.0000 VOTE',
                cleaned_count: 0,
                settings: [ { "key": "lightballot", "value": 0 }, { "key": "revotable", "value": 1 }, { "key": "voteliquid", "value": 0 }, { "key": "votestake", "value": 1 } ] ,
                begin_time: '1999-01-01T00:00:00.000',
                end_time: '1999-01-11T00:00:00.000'
            }]
        })

        await telosworks.loadFixtures("config", require("../fixtures/telosworks/config.json"));
        await telosworks.loadFixtures("profiles", require("../fixtures/telosworks/profiles.json"));
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 3,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "2001-01-01T00:00:00.000",
                    "vote_end_ts":"1999-01-11T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
       await telosworks.loadFixtures("proposals", {
           "": [
               {
                "proposal_id": "0",
                "proposer": "user1",
                "timeline": "timeline",
                "number_milestones": 5,
                "pdf": "pdf",
                "usd_amount": "10.0000 USD",
                "locked_tlos_amount": "0.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
               },
               {
                "proposal_id": "1",
                "proposer": "user1",
                "timeline": "new timeline",
                "number_milestones": 5,
                "pdf": "pdf",
                "usd_amount": "10.0000 USD",
                "locked_tlos_amount": "0.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
               }
           ]
        })
    });

    it("End Voting succeeds if called by build director", async () => { 
        //expect.assertions(1);

        await telosworks.contract.endvoting({
            project_id: 0,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);

        const project = telosworks.getTableRowsScoped("projects")["telosworks"];
        expect(project.find(proj => proj.project_id === "0")).toEqual({
                project_id: '0',
                title: 'Title',
                ballot_name: "ballot",
                status: 4,
                build_director: 'user1',
                description: 'description',
                github_url: 'url',
                usd_rewarded: '10.0000 USD',
                tlos_locked: '0.0000 TLOS',
                proposal_selected: [],
                proposals_rewarded: ["1", "0"],
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
                update_ts: '2000-01-01T00:00:00.000',
                propose_end_ts: "2001-01-01T00:00:00.000",
                vote_end_ts: "1999-01-11T00:00:00.000",
                start_ts: "2000-01-01T00:00:00.000",
                end_ts: "2000-01-01T00:00:00.000",
        })
    });

    it("End Voting succeeds if called by administrator", async () => { 
        //expect.assertions(1);

        await telosworks.contract.endvoting({
            project_id: 0,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);

        const project = telosworks.getTableRowsScoped("projects")["telosworks"];
        expect(project.find(proj => proj.project_id === "0")).toEqual({
                project_id: '0',
                title: 'Title',
                ballot_name: "ballot",
                status: 4,
                build_director: 'user1',
                description: 'description',
                github_url: 'url',
                usd_rewarded: '10.0000 USD',
                tlos_locked: '0.0000 TLOS',
                proposal_selected: [],
                proposals_rewarded: ["1", "0"],
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
                update_ts: '2000-01-01T00:00:00.000',
                propose_end_ts: "2001-01-01T00:00:00.000",
                vote_end_ts: "1999-01-11T00:00:00.000",
                start_ts: "2000-01-01T00:00:00.000",
                end_ts: "2000-01-01T00:00:00.000",
        })


    });

    it("fails if project not found", async () => { 
        await expect(telosworks.contract.endvoting({
            project_id: 54,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project not found");
    });

    it("fails if project is not in voting state", async () => { 
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 2,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1999-01-01T00:00:00.000",
                    "vote_end_ts": "1999-01-11T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await expect(telosworks.contract.endvoting({
            project_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project status must be in voting state");
    });

    it("fails if trying to end voting before proposing time ended", async () => { 
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 3,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1999-12-31T00:00:00.000",
                    "vote_end_ts": "2001-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await expect(telosworks.contract.endvoting({
            project_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Vote time has not ended");
    });

    it("fails if user other than build director or admin tries to end voting", async () => { 
         await expect(telosworks.contract.endvoting({
            project_id: 54,
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])).rejects.toThrow();
    });

});
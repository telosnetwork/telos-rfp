const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Select Proposal Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let eosiotoken = blockchain.createAccount("eosio.token");

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

        eosiotoken.setContract(blockchain.contractTemplates["eosio.token"]);
    });

    beforeEach(async () => {
        telosworks.resetTables();

        await telosworks.loadFixtures("config", require("../fixtures/telosworks/config.json"));
        await telosworks.loadFixtures("profiles", require("../fixtures/telosworks/profiles.json"));
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 4,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [0, 1],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1999-01-01T00:00:00.000",
                    "vote_end_ts": "1999-11-01T00:00:00.000",
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
               },
                {
                "proposal_id": "2",
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

    it("Pick proposal succeeds", async () => { 
        expect.assertions(1);

        await telosworks.contract.pickproposal({
            project_id: 0,
            proposal_id: 1
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])

        const project = telosworks.getTableRowsScoped("projects")["telosworks"];
        expect(project.find(proj => proj.project_id === "0")).toEqual({
                project_id: '0',
                title: 'Title',
                ballot_name: "",
                status: 5,
                build_director: 'user1',
                description: 'description',
                github_url: 'url',
                usd_rewarded: '10.0000 USD',
                tlos_locked: '0.0000 TLOS',
                proposal_selected: ["1"],
                proposals_rewarded: ["0","1"],
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
                update_ts: '2000-01-01T00:00:00.000',
                propose_end_ts: "1999-01-01T00:00:00.000",
                vote_end_ts: '1999-11-01T00:00:00.000',
                start_ts: "2000-01-01T00:00:00.000",
                end_ts: "2000-01-01T00:00:00.000",
        })
    });


    it("fails if project not found", async () => { 
        await expect(telosworks.contract.pickproposal({
            project_id: 54,
            proposal_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project not found");
    });

    it("fails if project is not in voted state", async () => { 
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
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
          });
        
        await expect(telosworks.contract.pickproposal({
            project_id: 1,
            proposal_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project must be in voted status");
    });


    it("fails if proposals selected is not between the proposals rewarded", async () => { 
        await expect(telosworks.contract.pickproposal({
            project_id: 0,
            proposal_id: 2,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow( "Proposal selected must be one of the proposals rewarded");
    });


    it("fails if user other than build director tries to select proposal", async () => { 
        await expect(telosworks.contract.pickproposal({
            project_id: 0,
            proposal_id: 1
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])).rejects.toThrow();
    });

});
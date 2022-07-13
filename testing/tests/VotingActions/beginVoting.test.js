const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Begin Voting Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let decide = blockchain.createAccount("telos.decide");
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

        decide.setContract(blockchain.contractTemplates["telos.decide"]);
        eosiotoken.setContract(blockchain.contractTemplates["eosio.token"]);
    });

    beforeEach(async () => {
        telosworks.resetTables();
        decide.resetTables();
        eosiotoken.resetTables();

        await eosiotoken.loadFixtures();

        await decide.loadFixtures();

        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "",
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
       await telosworks.loadFixtures("proposals", {
           "": [
               {
                "proposal_id": "0",
                "proposer": "user1",
                "number_milestones": 5,
                "timeline": "timeline",
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
                "number_milestones": 5,
                "timeline": "new timeline",
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

    it.skip("Begin voting succeeds", async () => { 
        await telosworks.loadFixtures("config", {
            "telosworks": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "build_directors": ["user1"],
                    "reward_percentage": 0.05,
                    "bonus_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })

        await telosworks.contract.beginvoting({
            project_id: 0,
            ballot_name: "ballot"
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);

        const conf = telosworks.getTableRowsScoped("config")["telosworks"][0];
        console.log(conf);

        const project = telosworks.getTableRowsScoped("projects")["telosworks"][0];
        console.log(project);

        const ballot = decide.getTableRowsScoped("ballots")["telos.decide"][0];
        console.log(ballot.options);

    });


    it("fails if project not found", async () => { 
         await telosworks.loadFixtures("config", {
            "telosworks": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "build_directors": ["user1"],
                    "reward_percentage": 0.05,
                    "bonus_percentage": 0.05,
                    "milestones_days":14
                }
            ]
         })
        
        await expect(telosworks.contract.beginvoting({
            project_id: 54,
            ballot_name: "ballot"
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project not found");
    });

    it("fails if project is not in published state", async () => { 
         await telosworks.loadFixtures("config", {
            "telosworks": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "build_directors": ["user1"],
                    "reward_percentage": 0.05,
                    "bonus_percentage": 0.05,
                    "milestones_days":14
                }
            ]
         })
        
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 4,
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
        
        await expect(telosworks.contract.beginvoting({
            project_id: 1,
            ballot_name: "ballot"
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project must be in published status");
    });

    
    it("fails if propose end time hasn't been reached yet", async () => { 

         await telosworks.loadFixtures("config", {
            "telosworks": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "build_directors": ["user1"],
                    "reward_percentage": 0.05,
                    "bonus_percentage": 0.05,
                    "milestones_days":14
                }
            ]
         })
        
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
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
                    "propose_end_ts": "2001-12-31T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await expect(telosworks.contract.beginvoting({
            project_id: 1,
            ballot_name: "ballot"
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Can't start voting process until proposing time has ended.");
    }); 

    it("fails if there are not enough available funds to init voting", async () => { 
         await telosworks.loadFixtures("config", {
            "telosworks": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "5.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "build_directors": ["user1"],
                    "reward_percentage": 0.05,
                    "bonus_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })
        await expect(telosworks.contract.beginvoting({
            project_id: 0,
            ballot_name: "ballot"
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Telos Works has insufficient available funds");
    });

    it("fails if user other than build director tries to begin voting", async () => {
         await telosworks.loadFixtures("config", {
            "telosworks": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "build_directors": ["user1"],
                    "reward_percentage": 0.05,
                    "bonus_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })
        await expect(telosworks.contract.beginvoting({
            project_id: 0,
            ballot_name: "ballot"
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])).rejects.toThrow();
    });

});
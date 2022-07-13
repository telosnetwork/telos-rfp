const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Start project Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let user3 = blockchain.createAccount("user3");
    let eosiotoken = blockchain.createAccount("eosio.token");
    let delphioracle = blockchain.createAccount("delphioracle");

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
        delphioracle.setContract(blockchain.contractTemplates["delphioracle"]);

        await delphioracle.loadFixtures();

    });

    beforeEach(async () => {
        telosworks.resetTables();

        await telosworks.loadFixtures("config", require("../fixtures/telosworks/config.json"));
        await telosworks.loadFixtures("profiles", {
            "telosworks": [
                {
                    "account": "user2",
                    "tlos_balance": "100.0000 TLOS"
                }
            ]
        });
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 4,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "5.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [0,1],
                    "proposal_selected": [0],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "2001-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });

        await telosworks.loadFixtures("proposals", {
           "": [{
                "proposal_id": "0",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": 5,
                "pdf": "pdf",
                "usd_amount": "10.0000 USD",
                "locked_tlos_amount": "0.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            },{
                "proposal_id": "1",
                "proposer": "user3",
                "timeline": "timeline",
                "number_milestones": 5,
                "pdf": "pdf",
                "usd_amount": "15.0000 USD",
                "locked_tlos_amount": "0.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
    });

    it("Start Project succeeds", async () => { 
        expect.assertions(6);

        await telosworks.contract.startproject({
            project_id: 0,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);

        const config = telosworks.getTableRowsScoped("config")["telosworks"][0];
        expect(config).toEqual({
            contract_version: '0.1.0',
            administrator: 'admin',
            available_funds: '22.0000 TLOS',
            reserved_funds: '28.0000 TLOS',
            build_directors: [ 'user1' ],
            reward_percentage: 0.05,
            bonus_percentage: 0.05,
            milestones_days: 14,
            tlos_locked_time: 365
        })

        const projects = telosworks.getTableRowsScoped("projects")["telosworks"];
        expect(projects.find(proj => proj.project_id === "0")).toEqual({
            project_id: '0',
            title: 'Title',
            ballot_name: 'ballot',
            status: 6,
            build_director: 'user1',
            description: 'description',
            github_url: 'url',
            usd_rewarded: '5.0000 USD',
            tlos_locked: '14.0000 TLOS',
            number_proposals_rewarded: 2,
            proposals_rewarded: [ '0', '1' ],
            proposal_selected: [ '0' ],
            proposing_days: 10,
            voting_days: 10,
            update_ts: '2000-01-01T00:00:00.000',
            propose_end_ts: '2001-01-01T00:00:00.000',
            vote_end_ts: '1970-01-01T00:00:00.000',
            start_ts: '2000-01-01T00:00:00.000',
            end_ts: '2000-01-01T00:00:00.000'
        });

        const profiles = telosworks.getTableRowsScoped("profiles")["telosworks"];
        expect(profiles.find(prof => prof.account === "user2").tlos_balance).toEqual("114.0000 TLOS");
        expect(profiles.find(prof => prof.account === "user3").tlos_balance).toEqual("14.0000 TLOS");

        const lockedtlos = telosworks.getTableRowsScoped("lockedtlos");
        expect(lockedtlos).toEqual({
            user2: [
            {
                locked_id: '0',
                tlos_amount: '14.0000 TLOS',
                locked_until_ts: '2000-12-31T00:00:00.000'
            }
            ],
            user3: [
            {
                locked_id: '0',
                tlos_amount: '14.0000 TLOS',
                locked_until_ts: '2000-12-31T00:00:00.000'
            }
            ]
        });

        const proposals = telosworks.getTableRowsScoped("proposals")[""];
        expect(proposals).toEqual([
                {
                proposal_id: '0',
                proposer: 'user2',
                number_milestones: '5',
                timeline: 'timeline',
                pdf: 'pdf',
                usd_amount: '10.0000 USD',
                locked_tlos_amount: '30.0000 TLOS',
                mockups_link: 'mockups_link',
                kanban_board_link: 'kanban_board_link',
                update_ts: '2000-01-01T00:00:00.000'
                },
                {
                proposal_id: '1',
                proposer: 'user3',
                number_milestones: '5',
                timeline: 'timeline',
                pdf: 'pdf',
                usd_amount: '15.0000 USD',
                locked_tlos_amount: '0.0000 TLOS',
                mockups_link: 'mockups_link',
                kanban_board_link: 'kanban_board_link',
                update_ts: '2000-01-01T00:00:00.000'
                }
            ]
        );
    });

    it("fails if project not found", async () => { 
        await expect(telosworks.contract.startproject({
            project_id: 54,
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
                    "status": 2,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "5.0000 USD",
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
        
        await expect(telosworks.contract.startproject({
            project_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project status must be in voted status");
    });

    
    it("fails if telos Works has insufficient available funds", async () => { 
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
                    "tlos_locked": "500.0000 TLOS",
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
        
        await expect(telosworks.contract.startproject({
            project_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Telos Works has insufficient available funds");
    });

    it("fails if user other than build director tries to start project", async () => { 
        await expect(telosworks.contract.startproject({
            project_id: 0,
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])).rejects.toThrow();
    });

});
const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Return Bond for Project Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let user3 = blockchain.createAccount("user3");

    let eosiotoken = blockchain.createAccount("eosio.token");

    beforeAll(async () => {
        telosbuild.setContract(blockchain.contractTemplates[`telosbuild`]);
        telosbuild.updateAuth(`active`, `owner`, {
        accounts: [
            {
            permission: {
                actor: telosbuild.accountName,
                permission: `eosio.code`
            },
            weight: 1
            }
        ]
        });

        eosiotoken.setContract(blockchain.contractTemplates["eosio.token"]);
    });

    beforeEach(async () => {
        telosbuild.resetTables();
        eosiotoken.resetTables();

        await eosiotoken.loadFixtures("stat", require("./../fixtures/eosio.token/stat.json"));
        await eosiotoken.loadFixtures("accounts", {
            "telosbuild": [
                {
                    "balance": "50.0000 TLOS"
                }
            ],
        })

        await telosbuild.loadFixtures("profiles", {
            "telosbuild": [
                {
                    "account": "user2",
                    "tlos_balance": "0.0000 TLOS",
                    "locked_tlos_balance": "0.0000 TLOS",
                    "locked_tlos_bonds": "50.0000 TLOS"
                }
            ]
        })

        await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "0.0000 TLOS",
                    "reserved_funds": "50.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        });

        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "bond": "50.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
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

          await telosbuild.loadFixtures("proposals", {
            "telosbuild": [
                {
                    "proposal_id": "1",
                    "project_id": "0",
                    "status": "3",
                    "title": "Title",
                    "proposer": "user2",
                    "number_milestones": 5,
                    "timeline": "timeline",
                    "tech_qualifications_pdf": "tech_pdf",
                    "approach_pdf": "approach_pdf",
                    "cost_and_schedule_pdf": "cost&schedule_pdf",
                    "references_pdf": "references_pdf",
                    "usd_amount": "10.0000 USD",
                    "mockups_link": "mockups_link",
                    "kanban_board_link": "kanban_board_link",
                    "update_ts": "2000-01-01T00:00:00.000"
                },
                {
                    "proposal_id": "2",
                    "project_id": "0",
                    "status": "1",
                    "title": "Title",
                    "proposer": "user2",
                    "number_milestones": 5,
                    "timeline": "timeline",
                    "tech_qualifications_pdf": "tech_pdf",
                    "approach_pdf": "approach_pdf",
                    "cost_and_schedule_pdf": "cost&schedule_pdf",
                    "references_pdf": "references_pdf",
                    "usd_amount": "10.0000 USD",
                    "mockups_link": "mockups_link",
                    "kanban_board_link": "kanban_board_link",
                    "update_ts": "2000-01-01T00:00:00.000"
                }
            ]
        });
    });

    it("action succeeds and return bond", async () => {
        expect.assertions(6);

        await telosbuild.contract.returnbond({ proposal_id: 2, return_bond: true },
            [{
                actor: user1.accountName,
                permission: "active"
            }]);
        
        const profiles = telosbuild.getTableRowsScoped("profiles")["telosbuild"];
        expect(profiles.find(prof => prof.account === "user2")).toEqual({
            account: "user2",
            tlos_balance: "0.0000 TLOS",
            locked_tlos_balance: "0.0000 TLOS",
            locked_tlos_bonds: "0.0000 TLOS",
        });

        const config = telosbuild.getTableRowsScoped("config")["telosbuild"][0];
        expect(config.available_funds).toEqual("0.0000 TLOS");
        expect(config.reserved_funds).toEqual("0.0000 TLOS");

        const balances = eosiotoken.getTableRowsScoped("accounts");
        expect(balances["user2"][0].balance).toEqual("50.0000 TLOS");
        expect(balances["telosbuild"][0].balance).toEqual("0.0000 TLOS")    ;

        const proposals = telosbuild.getTableRowsScoped("proposals")["telosbuild"];
        expect(proposals.find(prop => prop.proposal_id === "2").status).toEqual(3);
    });

    it("action succeeds and not return bond", async () => {
        expect.assertions(6);

        await telosbuild.contract.returnbond({ proposal_id: 2, return_bond: false },
            [{
                actor: user1.accountName,
                permission: "active"
            }]);
        
        const profiles = telosbuild.getTableRowsScoped("profiles")["telosbuild"];
        expect(profiles.find(prof => prof.account === "user2")).toEqual({
            account: "user2",
            tlos_balance: "0.0000 TLOS",
            locked_tlos_balance: "0.0000 TLOS",
            locked_tlos_bonds: "0.0000 TLOS",
        });

        const config = telosbuild.getTableRowsScoped("config")["telosbuild"][0];
        expect(config.available_funds).toEqual("50.0000 TLOS");
        expect(config.reserved_funds).toEqual("0.0000 TLOS");

        const balances = eosiotoken.getTableRowsScoped("accounts");
        expect(balances["telosbuild"][0].balance).toEqual("50.0000 TLOS");
        expect(balances["user2"]).toBeUndefined();

        const proposals = telosbuild.getTableRowsScoped("proposals")["telosbuild"];
        expect(proposals.find(prop => prop.proposal_id === "2").status).toEqual(4);
    });

    it("fails if proposal not found", async () => {
         await expect(telosbuild.contract.returnbond({proposal_id: 15, return_bond: false},
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Proposal not found");
    });

    it("fails if proposal is not in drafting status", async () => {
        await expect(telosbuild.contract.returnbond({proposal_id: 1, return_bond: false},
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Can only return bond if proposal is in drafting status");
    });

    it("fails if trying to return bond and proposing time hasn't ended", async () => {
         await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "bond": "50.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "2000-12-31T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });

          await telosbuild.loadFixtures("proposals", {
            "telosbuild": [
                {
                    "proposal_id": "5",
                    "project_id": "1",
                    "status": "1",
                    "title": "Title",
                    "proposer": "user2",
                    "number_milestones": 5,
                    "timeline": "timeline",
                    "tech_qualifications_pdf": "tech_pdf",
                    "approach_pdf": "approach_pdf",
                    "cost_and_schedule_pdf": "cost&schedule_pdf",
                    "references_pdf": "references_pdf",
                    "usd_amount": "10.0000 USD",
                    "mockups_link": "mockups_link",
                    "kanban_board_link": "kanban_board_link",
                    "update_ts": "2000-01-01T00:00:00.000"
                }
            ]
          });
        
        await expect(telosbuild.contract.returnbond({proposal_id: 5, return_bond: false},
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Can only return bond if proposing period has ended");
    });


    it("fails if other than program manager tries", async () => {
        await expect(telosbuild.contract.returnbond({proposal_id: 1, return_bond: false},
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow();
    })



});
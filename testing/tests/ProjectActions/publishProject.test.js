const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Publish Project Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");

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
    });

    beforeEach(async () => {
        telosbuild.resetTables();

        await telosbuild.loadFixtures("config", require("../fixtures/telosbuild/config.json"));
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 1,
                    "bond": "10.0000 TLOS",
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
                    "propose_end_ts": "1970-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
    });

    it("Publish project", async () => {
        expect.assertions(1);

        await telosbuild.contract.publishprjct({ project_id: 0 },
            [{
                actor: user1.accountName,
                permission: "active"
            }]);

        expect(telosbuild.getTableRowsScoped("projects")["telosbuild"][0]).toEqual({
                project_id: '0',
                title: 'Title',
                ballot_name: "",
                status: 2,
                bond: "10.0000 TLOS",
                program_manager: 'user1',
                project_manager: "",
                description: 'description',
                github_url: 'url',
                pdf: "pdf",
                usd_rewarded: '10.0000 USD',
                tlos_locked: '0.0000 TLOS',
                proposal_selected: [],
                proposals_rewarded: [],
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
                update_ts: '2000-01-01T00:00:00.000',
                propose_end_ts: "2000-01-11T00:00:00.000",
                vote_end_ts: '1970-01-01T00:00:00.000',
                start_ts: "2000-01-01T00:00:00.000",
                end_ts: "2000-01-01T00:00:00.000",
            });
    });


    it("Fails to publish project if it doesn't exist", async () => {
        await expect(telosbuild.contract.publishprjct({ project_id: 15 },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("project not found");
    });

     it("Fails to publish project if it is in status other than drafting", async () => {
        
      await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 15,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "bond": "10.0000 TLOS",
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
                    "propose_end_ts": "1970-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
         
        await expect(telosbuild.contract.publishprjct({ project_id: 15 },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("project must be drafting to publish it");
    });
    
    it("Fails to publish project if user other than program manager tries to delete it", async () => {

        await expect(telosbuild.contract.publishprjct({ project_id: 0 },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow();
    });
});
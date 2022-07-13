const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Edit Project Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");

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
                    "pdf":"QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
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

    it("edit project", async () => {
        expect.assertions(1)
        await telosbuild.contract.editproject(
            {
                project_id: 0,
                bond: "15.0000 TLOS",
                title: "New title",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "100.0000 USD",
                number_proposals_rewarded: 4,
                proposing_days: 5,
                voting_days: 15,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }]);

        const project = telosbuild.getTableRowsScoped("projects")[telosbuild.accountName];
        expect(project[0]).toEqual(
            {
                project_id: '0',
                title: 'New title',
                ballot_name: "",
                bond: '15.0000 TLOS',
                status: 1,
                program_manager: 'user1',
                project_manager: "",
                description: 'New description',
                github_url: 'New url',
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                proposal_selected: [],
                proposals_rewarded: [],
                usd_rewarded: '100.0000 USD',
                tlos_locked: '0.0000 TLOS',
                number_proposals_rewarded: 4,
                proposing_days: 5,
                start_ts: "2000-01-01T00:00:00.000",
                end_ts: "2000-01-01T00:00:00.000",
                voting_days: 15,
                update_ts: '2000-01-01T00:00:00.000',
                propose_end_ts: '1970-01-01T00:00:00.000',
                vote_end_ts: '1970-01-01T00:00:00.000'
            }
        )
    });

    it("fails to edit project if it doesn't exist", async () => {
        await expect(telosbuild.contract.editproject(
            {
                project_id: 15,
                title: "New title",
                bond: "15.0000 TLOS",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "100.0000 USD",
                number_proposals_rewarded: 4,
                proposing_days: 5,
                voting_days: 15,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("project not found");
    })

      it("fails to edit project if pdf hash isn't valid", async () => {
        await expect(telosbuild.contract.editproject(
            {
                project_id: 0,
                title: "New title",
                bond: "15.0000 TLOS",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW0f2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "100.0000 USD",
                number_proposals_rewarded: 4,
                proposing_days: 5,
                voting_days: 15,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    })


    it("fails to edit project if it isn't in drafting state", async () => {
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
                    "pdf":"QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
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
        await expect(telosbuild.contract.editproject(
            {
                project_id: 15,
                title: "New title",
                bond: "15.0000 TLOS",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "100.0000 USD",
                number_proposals_rewarded: 4,
                proposing_days: 5,
                voting_days: 15,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("project must be drafting to edit");
    })


    it("fails to edit project if usd rewarded symbol isn't valid", async () => {
        await expect(telosbuild.contract.editproject(
            {
                project_id: 0,
                title: "New title",
                bond: "15.0000 TLOS",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.0000 TLOS",
                number_proposals_rewarded: 4,
                proposing_days: 5,
                voting_days: 15,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("asset has to be USD and greater than zero");
    })


    it("fails to edit project if usd rewarded amount isn't valid", async () => {
        await expect(telosbuild.contract.editproject(
            {
                project_id: 0,
                title: "New title",
                bond: "15.0000 TLOS",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "0.0000 USD",
                number_proposals_rewarded: 4,
                proposing_days: 5,
                voting_days: 15,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("asset has to be USD and greater than zero");
    })

     it("fails to edit bond if symbol isn't valid", async () => {
        await expect(telosbuild.contract.editproject(
            {
                project_id: 0,
                title: "New title",
                bond: "10.0000 USD",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "0.0000 USD",
                number_proposals_rewarded: 4,
                proposing_days: 5,
                voting_days: 15,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Bond must be set in TLOS");
     })
    
    it("fails to edit bond if amount isn't valid", async () => {
        await expect(telosbuild.contract.editproject(
            {
                project_id: 0,
                title: "New title",
                bond: "0.0000 TLOS",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "0.0000 USD",
                number_proposals_rewarded: 4,
                proposing_days: 5,
                voting_days: 15,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Bond has to be greater than zero");
    })


    it("fails to edit project if proposals rewarded is 0", async () => {
        await expect(telosbuild.contract.editproject(
            {
                project_id: 0,
                title: "New title",
                bond: "15.0000 TLOS",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "100.0000 USD",
                number_proposals_rewarded:0,
                proposing_days: 5,
                voting_days: 15,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("number_proposals_rewarded must be greater than zero");
    })

    it("fails to edit project if voting days is 0", async () => {
        await expect(telosbuild.contract.editproject(
            {
                project_id: 0,
                title: "New title",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                bond: "15.0000 TLOS",
                usd_rewarded: "100.0000 USD",
                number_proposals_rewarded: 4,
                proposing_days: 5,
                voting_days: 0,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("voting days must be greater than zero");
    })

    it("fails to edit project if proposing days is 0", async () => {
        await expect(telosbuild.contract.editproject(
            {
                project_id: 0,
                title: "New title",
                description: "New description",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                bond: "15.0000 TLOS",
                usd_rewarded: "100.0000 USD",
                number_proposals_rewarded: 4,
                proposing_days: 0,
                voting_days: 15,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("proposing days must be greater than zero");
    })


    it("fails to edit project if user that isn't program manager tries to do it", async () => {
        await expect(telosbuild.contract.editproject(
            {
                project_id: 0,
                title: "New title",
                description: "New description",
                bond: "15.0000 TLOS",
                github_url: "New url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "100.0000 USD",
                number_proposals_rewarded: 4,
                proposing_days: 5,
                voting_days: 15,
            },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow();
    })
});
const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Draft Project Telos Works Smart Contract Tests", () => {
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

    });

    it("draft project", async () => {
        expect.assertions(1)
        await telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "user1",
                description: "description",
                bond: "15.0000 TLOS",
                github_url: "url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.0000 USD",
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }]);

        const project = telosbuild.getTableRowsScoped("projects")[telosbuild.accountName];
        expect(project[0]).toEqual(
            {
                project_id: '0',
                title: 'Title',
                ballot_name: "",
                status: 1,
                bond: "15.0000 TLOS",
                program_manager: 'user1',
                project_manager: "",
                description: 'description',
                github_url: 'url',
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: '10.0000 USD',
                proposal_selected: [],
                proposals_rewarded: [],
                tlos_locked: '0.0000 TLOS',
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
                update_ts: '2000-01-01T00:00:00.000',
                propose_end_ts: '1970-01-01T00:00:00.000',
                vote_end_ts: '1970-01-01T00:00:00.000',
                start_ts: '1970-01-01T00:00:00.000',
                end_ts: "1970-01-01T00:00:00.000",
            }
        )
    });

    it("fails to draft project if pdf hash isn't valid", async () => {
        await expect(telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "user1",
                bond: "15.0000 TLOS",
                description: "description",
                github_url: "url",
                pdf: "QmTtDTXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.0000 USD",
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    })

    it("fails to draft project if usd rewarded symbol isn't valid", async () => {
        await expect(telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "user1",
                bond: "15.0000 TLOS",
                description: "description",
                github_url: "url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.00000000 WAX",
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("asset has to be USD and greater than zero");
    })

    it("fails to draft project if usd rewarded amount isn't valid", async () => {
        await expect(telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "user1",
                bond: "15.0000 TLOS",
                description: "description",
                github_url: "url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "0.0000 USD",
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("asset has to be USD and greater than zero");
    })

     it("fails to draft project if tlos bond symbol isn't valid", async () => {
        await expect(telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "user1",
                bond: "15.0000 USD",
                description: "description",
                github_url: "url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.0000 USD",
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Bond must be set in TLOS");
    })

    it("fails to draft project if tlos bond amount isn't valid", async () => {
        await expect(telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "user1",
                bond: "0.0000 TLOS",
                description: "description",
                github_url: "url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.0000 USD",
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Bond amount must be greater than zero");
    })

    it("fails to draft project if number_proposals_rewarded is 0", async () => {
        await expect(telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "user1",
                bond: "15.0000 TLOS",
                description: "description",
                github_url: "url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.0000 USD",
                number_proposals_rewarded: 0,
                proposing_days: 10,
                voting_days: 10,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow( "number_proposals_rewarded must be greater than zero");
    })

    it("fails to draft project if voting_days is 0", async () => {
        await expect(telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "user1",
                bond: "15.0000 TLOS",
                description: "description",
                github_url: "url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.0000 USD",
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 0,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("voting days must be greater than zero");
    })

    it("fails to draft project if proposing_days is 0", async () => {
        await expect(telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "user1",
                bond: "15.0000 TLOS",
                description: "description",
                github_url: "url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.0000 USD",
                number_proposals_rewarded: 2,
                proposing_days: 0,
                voting_days: 10,
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("proposing days must be greater than zero");
    })


    it("fails to draft project if user that isn't program manager tries to do it", async () => {
        await expect(telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "admin",
                bond: "15.0000 TLOS",
                description: "description",
                github_url: "url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.0000 USD",
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
            },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow("Only program managers can create projects");
    })

    it("fails to draft project if user isn't the same as the one in program_manager parameter", async () => {
        await expect(telosbuild.contract.draftproject(
            {
                title: "Title",
                program_manager: "user1",
                bond: "15.0000 TLOS",
                description: "description",
                github_url: "url",
                pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_rewarded: "10.0000 USD",
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
            },
            [{
                actor: admin.accountName,
                permission: "active"
            }])).rejects.toThrow();
    })

});
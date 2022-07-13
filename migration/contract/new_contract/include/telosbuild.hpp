// TLOS Works is a Worker Proposal System for the TLOS Blockchain Network.
//
// @author Roger Taule
// @contract telosbuild
// @version v0.1.0

#include <eosio/eosio.hpp>
#include <eosio/singleton.hpp>
#include <eosio/asset.hpp>
#include <eosio/action.hpp>
#include "delphioracle-interface.hpp"
#include "telosdecide-interface.hpp"

using namespace std;
using namespace eosio;
using namespace delphioracle;
using namespace telosdecide;

//approved treasuries: VOTE
//categories added by default: marketing, infra.tools, dev.tools, governance, other

CONTRACT telosbuild : public contract {
    public:
        using contract::contract;

        static constexpr symbol TLOS_SYM = symbol("TLOS", 4);
        static constexpr symbol VOTE_SYM = symbol("VOTE", 4);
        static constexpr symbol USD_SYM = symbol("USD", 4);

        const asset DRAFT_COST = asset(100000, TLOS_SYM);

        const size_t  MAX_TITLE_LEN = 64;
        const size_t  MAX_DESCR_LEN = 160;

        enum class project_status : uint8_t {
            drafting          = 1,
            published         = 2,
            voting            = 3,
            voted             = 4,
            selected          = 5,
            started           = 6,
            completed         = 7,
            cancelled         = 8,
        };

        friend constexpr bool operator == ( const uint8_t& a, const project_status& b) {
            return a == static_cast<uint8_t>(b);
        }

        enum class proposal_status : uint8_t {
            drafting          = 1,
            //submitted         = 2,
            accepted          = 3,
            spam              = 4,
            rewarded          = 5,
            selected          = 6
        };

        friend constexpr bool operator == ( const uint8_t& a, const proposal_status& b) {
            return a == static_cast<uint8_t>(b);
        }

        friend constexpr bool operator != ( const uint8_t& a, const proposal_status& b) {
            return a != static_cast<uint8_t>(b);
        }

        enum class milestone_status : uint8_t {
            pending          = 1,
            sent             = 2,
            reviewed         = 3,
        };

        friend constexpr bool operator == ( const uint8_t& a, const milestone_status& b) {
            return a == static_cast<uint8_t>(b);
        }

        //ACTION copytables();

        //======================== config actions ========================

        //initialize the contract
        //pre: config table not initialized
        //auth: self
        ACTION init(name initial_admin);

        //set contract version
        //auth: administrator
        ACTION setversion(string new_version);

        //set new admin
        //pre: new_admin account exists 
        //auth: administrator
        ACTION setadmin(name new_admin);

        //set new locked time 
        //auth: administrator
        ACTION setlckdtime(uint32_t days);

        //set new milestone length
        //auth: administrator
        ACTION setmilestone(uint32_t days);

        //===================== Administrator Actions =====================

        //Add a new program manager
        //auth: administrator
        ACTION addmanager(name manager);

        //Remove a program manager
        //auth: administrator
        ACTION rmvmanager(name manager);

        //Add user to the blacklist
        //auth: administrator
        ACTION adduserbl(name account);

        //Remove user from the blacklist
        //auth: administrator
        ACTION rmvuserbl(name account);
        
        
        //======================== profile actions ========================

        // //create a new profile
        // //auth: telos_account
        // ACTION addprofile(name account, string full_name, string country, string email, string company);

        // //remove a profile
        // //auth: account or administrator
        // ACTION rmvprofile(name account);

        //claims rewards for either a proposal rewarded or a milestone
        //pre: now > locked_until_ts 
        //auth: account
        ACTION claimreward(name account, uint64_t locked_id);


        //withdraw from account balance
        //pre: profiles.tlos_balance >= quantity
        //auth: account
        ACTION withdraw(name account, asset quantity);


        //======================= project actions =========================

        //creates a new project
        //post: project.status == drafting
        //auth: program_manager
        ACTION draftproject(string title, name program_manager, asset bond, string description, string github_url, string pdf,
        asset usd_rewarded, uint8_t number_proposals_rewarded, uint32_t proposing_days, uint32_t voting_days);

        //edits a project
        //pre: project.status == drafting
        //auth: program_manager
        ACTION editproject(uint64_t project_id, optional<asset> bond, optional<string> title, optional<string> description, 
        optional<string> github_url, optional<string> pdf, optional<asset> usd_rewarded, optional<uint8_t> number_proposals_rewarded,
        optional<uint32_t> proposing_days, optional<uint32_t> voting_days);

        //Removes a project
        //pre: project.status == drafting
        //auth: program_manager
        ACTION rmvproject(uint64_t project_id);

        //Publishes a project so users can send proposals
        //pre: project.status == drafting
        //post: project.status == published
        //auth: program_manager
        ACTION publishprjct(uint64_t project_id);

        //Starts a project after voting process has finished and proposals rewarded and selected are chosen
        //pre: project.status == selected
        //post: project.status == started
        //auth: program_manager
        ACTION startproject(uint64_t project_id);

        //Ends a project after all milestones has been completed and reviewed
        //pre: project.status == started
        //post: project.status == completed
        //auth: program_manager
        ACTION endproject(uint64_t project_id);
        
        //======================= proposal actions =========================

        //Creates a new proposal for a project
        //pre: project.status == published
        //auth: proposer
        ACTION newproposal(uint64_t project_id, name proposer, string title, uint64_t number_milestones, string timeline,
        string tech_qualifications_pdf, string approach_pdf, string cost_and_schedule_pdf, string references_pdf,
         asset usd_amount, string mockups_link, string kanban_board_link);

        //Edits a proposal for a project
        //pre: project.status == published
        //auth: proposal.proposer
        ACTION editproposal(uint64_t proposal_id, optional<string> title, optional<string> timeline, optional<uint64_t> number_milestones,
        optional<string> tech_qualifications_pdf, optional<string> approach_pdf, optional<string> cost_and_schedule_pdf,
        optional<string> references_pdf,optional<asset> usd_amount, optional<string> mockups_link, optional<string> kanban_board_link);

        // //Submits a proposal for a project
        // //pre: project.status == published
        // //auth: proposal.proposer
        // ACTION sendproposal(uint64_t proposal_id);

        //Removes a proposal for a project
        //pre: project.status == published
        //auth: proposal.proposer
        ACTION rmvproposal(uint64_t proposal_id);

        ACTION returnbond(uint64_t proposal_id, bool return_bond);

        //======================== voting actions =========================

        //pass a winner proposal and proposals rewarded, without going through voting
        //pre: project.status == published
        //post: project.status == voting
        //auth: program_manager
        ACTION skipvoting(uint64_t project_id, uint64_t proposal_selected, vector<uint64_t> proposals_rewarded);

        //begin voting period on a proposal
        //pre: project.status == published and propose_end_time > now
        //auth: program_manager
        ACTION beginvoting(uint64_t project_id, name ballot_name, optional<bool> cancel);

        //end voting period on a proposal and receive ballot results
        //pre: project.status == voting, now > decide::ballot.end_time
        //post: project.status == voted
        //auth: program_manager
        ACTION endvoting(uint64_t project_id);

        //after the proposals rewarded has been selected through the voting process, select the proposal to be executed
        //pre: project.status == voted
        //post: project.status == selected
        //auth: program_manager
        ACTION pickproposal(uint64_t project_id, uint64_t proposal_id);

        //======================= milestones actions =======================

        //send a report for a milestone
        //pre: project.status == started and milestone.status == pending
        //post: milestone.status == sent
        //auth: proposal.proposer
        ACTION sendreport(uint64_t project_id, uint64_t milestone_id, string title, string description, string documents);

        //Review a milestone and give rewards
        //pre: project.status == started and milestone.status == sent
        //post: milestone.status == reviewed
        //auth: program manager
        ACTION reviewreport(uint64_t project_id, uint64_t milestone_id, bool pay_reward);

        //====================== notification handlers ======================

        //catches transfer notification from eosio.token
        [[eosio::on_notify("eosio.token::transfer")]]
        void catch_transfer(name from, name to, asset quantity, string memo);

        //catches broadcast notification from decide
        [[eosio::on_notify("telos.decide::broadcast")]]
        void catch_broadcast(name ballot_name, map<name, asset> final_results, uint32_t total_voters);

        //======================== functions ========================

        //calls delphioracle and returns wax - usd price
        uint64_t tlosusdprice();

        //======================= wipe actions ====================

        //ACTION wipeconf();

        //ACTION wipeprojects();

        //======================= test actions ====================

        ACTION skpstartvote(uint64_t project_id);

        ACTION skpmilestone(uint64_t project_id, uint64_t milestone_id);

        //======================== contract tables ========================
        

        //config table
        //scope: self
        TABLE config {
            string contract_version; //semver compliant contract version
            name administrator; //account that can approve proposals for voting
            asset available_funds = asset(0, TLOS_SYM); //total available funding for projects
            asset reserved_funds = asset(0, TLOS_SYM); //total funding reserved by approved proposals
            vector<name> program_managers = vector<name>{};
            //vector<name> deprecated_program_managers = vector<name>{};
            double reward_percentage = 0.05; //Invariable
            uint8_t milestones_days = 14;
            uint32_t tlos_locked_time = 365;

            EOSLIB_SERIALIZE(config, (contract_version)(administrator)
            (available_funds)(reserved_funds)(program_managers)
            (reward_percentage)(milestones_days)(tlos_locked_time))
        };
        typedef singleton<name("config"), config> config_singleton;

        //profiles table
        //scope: self
        TABLE profile {
            name account;
            // string full_name;
            // string country;
            // string email;
            // string company;
            asset tlos_balance = asset(0, TLOS_SYM);
            asset locked_tlos_balance = asset(0, TLOS_SYM);
            asset locked_tlos_bonds = asset(0,TLOS_SYM);

            uint64_t primary_key() const { return account.value; }
            EOSLIB_SERIALIZE(profile, (account)/*(full_name)(country)(email)(company)*/
                (tlos_balance)(locked_tlos_balance)(locked_tlos_bonds))
        };
        typedef multi_index<name("profiles"), profile> profiles_table;

        //projects table
        //scope: self
        TABLE project {
            uint64_t project_id; //unique id of project;
            string title;
            name ballot_name;
            uint8_t status = static_cast<uint8_t>(project_status::drafting);
            name program_manager;
            name project_manager;
            asset bond;
            string description;
            string github_url;
            string pdf;
            asset usd_rewarded;
            asset tlos_locked = asset(0, TLOS_SYM); 
            uint8_t number_proposals_rewarded; 
            vector<uint64_t> proposals_rewarded = vector<uint64_t> {};  
            vector<uint64_t> proposal_selected = vector<uint64_t> {}; 
            uint32_t proposing_days;
            uint32_t voting_days;
            time_point_sec update_ts; // timestamp of latest proposal update
            time_point_sec propose_end_ts; // vote_endtime that was passed to decide contract
            time_point_sec vote_end_ts; // vote_endtime that was passed to decide contract
            time_point_sec start_ts; 
            time_point_sec end_ts;

            uint64_t primary_key() const { return project_id; }

            uint64_t by_program_manager() const { return program_manager.value; }

            uint64_t by_ballot() const { return ballot_name.value; }

            uint64_t by_status() const { return status; }

            uint64_t by_project_manager() const { return project_manager.value; }

            EOSLIB_SERIALIZE(project, (project_id)(title)(ballot_name)(status)(program_manager)(project_manager)(bond)(description)
            (github_url)(pdf)(usd_rewarded)(tlos_locked)(number_proposals_rewarded)(proposals_rewarded)(proposal_selected)
            (proposing_days)(voting_days)(update_ts)(propose_end_ts)(vote_end_ts)(start_ts)(end_ts))
        };
        typedef multi_index<name("projects"), project,
            indexed_by<name("byprogrammgr"), const_mem_fun<project, uint64_t, &project::by_program_manager>>,
            indexed_by<name("byballot"), const_mem_fun<project, uint64_t, &project::by_ballot>>,
            indexed_by<name("bystatus"), const_mem_fun<project, uint64_t, &project::by_status>>,
            indexed_by<name("byprojectmgr"), const_mem_fun<project, uint64_t, &project::by_project_manager>>
            > projects_table;


        //proposals table
        //scope: self
        TABLE proposal {
            uint64_t proposal_id; //unique id of proposal
            uint64_t project_id; 
            name proposer;
            uint8_t status = static_cast<uint8_t>(proposal_status::drafting);
            uint64_t number_milestones;
            string title;
            string timeline; //timeline csv;
            string tech_qualifications_pdf;
            string approach_pdf;
            string cost_and_schedule_pdf;
            string references_pdf;
            asset usd_amount;
            string mockups_link;
            string kanban_board_link;
            time_point_sec update_ts; // timestamp of latest proposal update

            uint64_t primary_key() const { return proposal_id; }

            uint64_t by_project() const { return project_id; }

            uint64_t by_proposer() const { return proposer.value; }

            uint64_t by_status() const { return status; }

            // Upper 16 bits: proposer, status; lower 32 bits: proposal_id
            uint64_t by_proposer_and_status() const { return (((uint64_t)proposer.value << 56)|((uint64_t)status << 48)|proposal_id); }

            uint128_t by_project_and_status() const { return ((uint128_t)project_id << 64)|((uint128_t)status); }

            EOSLIB_SERIALIZE(proposal, (proposal_id)(project_id)(proposer)(status)(number_milestones)(title)
            (timeline)(tech_qualifications_pdf)(approach_pdf)(cost_and_schedule_pdf)(references_pdf)
            (usd_amount)(mockups_link)(kanban_board_link)(update_ts))
        };
        typedef multi_index<name("proposals"), proposal,
            indexed_by<name("byproject"), const_mem_fun<proposal, uint64_t, &proposal::by_project>>,
            indexed_by<name("byproposer"), const_mem_fun<proposal, uint64_t, &proposal::by_proposer>>,
            indexed_by<name("bystatus"), const_mem_fun<proposal, uint64_t, &proposal::by_status>>,
            indexed_by<name("bypropstat"), const_mem_fun<proposal, uint64_t, &proposal::by_proposer_and_status>>,
            indexed_by<name("byprojstat"), const_mem_fun<proposal, uint128_t, &proposal::by_project_and_status>>
        > proposals_table;

        //milestones table
        //scope: project_id
        TABLE milestone {
            uint64_t milestone_id;
            uint8_t status = static_cast<uint8_t>(milestone_status::pending);
            asset tlos_rewarded;
            string title;
            string description;
            string documents;   
            time_point_sec start_ts;
            time_point_sec end_ts;
            time_point_sec send_ts;
            time_point_sec review_ts;

            uint64_t by_status() const { return status; }

            uint64_t primary_key() const { return milestone_id; }

            EOSLIB_SERIALIZE(milestone, (milestone_id)(status)(tlos_rewarded)(title)
            (description)(documents)(start_ts)(end_ts)(send_ts)(review_ts))
        };
        typedef multi_index<name("milestones"), milestone,
            indexed_by<name("bystatus"), const_mem_fun<milestone, uint64_t, &milestone::by_status>>
            > milestones_table;
        
        //locked telos amounts table
        //scope: account_name
        TABLE locked_tlos {
            uint64_t locked_id;
            asset tlos_amount;
            time_point_sec locked_until_ts;
            string memo;

            auto primary_key()const { return locked_id; }

            EOSLIB_SERIALIZE(locked_tlos, (locked_id)(tlos_amount)(locked_until_ts)(memo));
        };
        typedef multi_index<name("lockedtlos"), locked_tlos> locked_tlos_table;

        //Blacklist of users
        TABLE userbl {
            name account;
            auto primary_key()const { return account.value; }
        };

        typedef eosio::multi_index<name("usersbl"), userbl> blacklist_users;
};
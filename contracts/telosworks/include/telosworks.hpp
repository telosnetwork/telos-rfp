// TLOS Works is a Worker Proposal System for the TLOS Blockchain Network.
//
// @author Roger Taule
// @contract telosworks
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

CONTRACT telosworks : public contract {
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
        };

        friend constexpr bool operator == ( const uint8_t& a, const project_status& b) {
            return a == static_cast<uint8_t>(b);
        }

        enum class milestone_status : uint8_t {
            pending          = 1,
            sent             = 2,
            reviewed         = 3,
        };

        friend constexpr bool operator == ( const uint8_t& a, const milestone_status& b) {
            return a == static_cast<uint8_t>(b);
        }

        //======================== config actions ========================

        //initialize the contract
        //pre: config table not initialized
        //auth: self
        ACTION init(name initial_admin);

        //set contract version
        //auth: admin_acct
        ACTION setversion(string new_version);

        //set new admin
        //pre: new_admin account exists 
        //auth: admin_acct
        ACTION setadmin(name new_admin);

        ACTION setlckdtime(uint32_t days);

        ACTION setmilestone(uint32_t days);

        ACTION setbonusperc(double bonus_percentage);
    
        //===================== Administrator Actions =====================

        ACTION addbuilddir(name director);

        ACTION rmvbuilddir(name director);

        ACTION adduserbl(name account);

        ACTION rmvuserbl(name account);
        
        
        //======================== profile actions ========================

        // //create a new profile
        // //auth: telos_account
        // ACTION addprofile(name account, string full_name, string country, string email, string company);

        // //remove a profile
        // //auth: account or admin_acct
        // ACTION rmvprofile(name account);

        ACTION claimreward(name account, uint64_t locked_id);

        //======================= project actions =========================


        ACTION draftproject(string title, name build_director, string description, string github_url, asset usd_rewarded, 
        uint8_t number_proposals_rewarded, uint32_t proposing_days, uint32_t voting_days);

        ACTION editproject(uint64_t project_id, optional<string> title, optional<string> description, 
        optional<string> github_url, optional<asset> usd_rewarded, optional<uint8_t> number_proposals_rewarded,
        optional<uint32_t> proposing_days, optional<uint32_t> voting_days);

        ACTION rmvproject(uint64_t project_id);

        ACTION publishprjct(uint64_t project_id);

        ACTION startproject(uint64_t project_id);

        ACTION endproject(uint64_t project_id);
        
        //======================= proposal actions =========================

        ACTION newproposal(uint64_t project_id, name proposer, uint64_t number_milestones, string timeline, string pdf, asset usd_amount, 
        string mockups_link, string kanban_board_link);

        ACTION editproposal(uint64_t project_id, uint64_t proposal_id, optional<string> timeline, optional<uint64_t> number_milestones,
        optional<string> pdf, optional<asset> usd_amount, optional<string> mockups_link, optional<string> kanban_board_link);

        ACTION rmvproposal(uint64_t project_id, uint64_t proposal_id);

        //======================== voting actions =========================

        //pass a winner proposal and proposals rewarded, without going through voting
        //pre: project.status == published
        //post: project.status == inprogress
        //auth: build_director
        ACTION skipvoting(uint64_t project_id, uint64_t proposal_selected, vector<uint64_t> proposals_rewarded);

        //begin voting period on a proposal
        //pre: project.status == published and propose_end_time > now
        //auth: build_director
        ACTION beginvoting(uint64_t project_id, name ballot_name);

        //end voting period on a proposal and receive ballot results
        //pre: proposal.status == voting, now > decide::ballot.end_time
        //post: proposal.status == inprogress
        //auth: build_director
        ACTION endvoting(uint64_t project_id);

        ACTION pickproposal(uint64_t project_id, uint64_t proposal_id);

        //======================= milestones actions =======================

        ACTION sendreport(uint64_t project_id, uint64_t milestone_id, string title, string description, string documents);

        ACTION reviewreport(uint64_t project_id, uint64_t milestone_id, bool pay_reward, bool bonus);

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

        //======================== contract tables ========================
        

        //config table
        //scope: self
        TABLE config {
            string contract_version; //semver compliant contract version
            name administrator; //account that can approve proposals for voting
            asset available_funds = asset(0, TLOS_SYM); //total available funding for projects
            asset reserved_funds = asset(0, TLOS_SYM); //total funding reserved by approved proposals
            vector<name> build_directors = vector<name>{};
            //vector<name> deprecated_build_directors = vector<name>{};
            double reward_percentage = 0.05; //Invariable
            double bonus_percentage = 0.05;//Variable
            uint8_t milestones_days = 14;
            uint32_t tlos_locked_time = 365;

            EOSLIB_SERIALIZE(config, (contract_version)(administrator)
            (available_funds)(reserved_funds)(build_directors)
            (reward_percentage)(bonus_percentage)(milestones_days)(tlos_locked_time))
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

            uint64_t primary_key() const { return account.value; }
            EOSLIB_SERIALIZE(profile, (account)/*(full_name)(country)(email)(company)*/(tlos_balance))
        };
        typedef multi_index<name("profiles"), profile> profiles_table;

        //projects table
        //scope: self
        TABLE project {
            uint64_t project_id; //unique id of project;
            string title;
            name ballot_name;
            uint8_t status = static_cast<uint8_t>(project_status::drafting);
            name build_director;
            string description;
            string github_url;
            asset usd_rewarded;
            asset tlos_locked = asset(0, TLOS_SYM); 
            uint8_t number_proposals_rewarded; 
            vector<uint64_t> proposals_rewarded = vector<uint64_t> {};  
            vector<uint64_t> proposal_selected = vector<uint64_t> {}; //0
            uint32_t proposing_days;
            uint32_t voting_days;
            time_point_sec update_ts; // timestamp of latest proposal update
            time_point_sec propose_end_ts; // vote_endtime that was passed to decide contract
            time_point_sec vote_end_ts; // vote_endtime that was passed to decide contract
            time_point_sec start_ts; 
            time_point_sec end_ts;

            uint64_t primary_key() const { return project_id; }

            uint64_t by_build_director() const { return build_director.value; }

            uint64_t by_ballot() const { return ballot_name.value; }


            EOSLIB_SERIALIZE(project, (project_id)(title)(ballot_name)(status)(build_director)(description)(github_url)
            (usd_rewarded)(tlos_locked)(number_proposals_rewarded)(proposals_rewarded)(proposal_selected)(proposing_days)
            (voting_days)(update_ts)(propose_end_ts)(vote_end_ts)(start_ts)(end_ts))
        };
        typedef multi_index<name("projects"), project,
            indexed_by<name("bydirector"), const_mem_fun<project, uint64_t, &project::by_build_director>>,
            indexed_by<name("byballot"), const_mem_fun<project, uint64_t, &project::by_ballot>>
            > projects_table;


        //proposals table
        //scope: project_id
        TABLE proposal {
            uint64_t proposal_id; //unique id of project;
            name proposer;
            uint64_t number_milestones;
            string timeline; //timeline csv;
            string pdf;
            asset usd_amount;
            asset locked_tlos_amount = asset(0, TLOS_SYM);
            string mockups_link;
            string kanban_board_link;
            time_point_sec update_ts; // timestamp of latest proposal update

            uint64_t primary_key() const { return proposal_id; }

            EOSLIB_SERIALIZE(proposal, (proposal_id)(proposer)(number_milestones)(timeline)(pdf)(usd_amount)
            (locked_tlos_amount)(mockups_link)(kanban_board_link)(update_ts))
        };
        typedef multi_index<name("proposals"), proposal> proposals_table;

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

            uint64_t primary_key() const { return milestone_id; }

            EOSLIB_SERIALIZE(milestone, (milestone_id)(status)(tlos_rewarded)(title)
            (description)(documents)(start_ts)(end_ts)(send_ts)(review_ts))
        };
        typedef multi_index<name("milestones"), milestone> milestones_table;
        
        //locked telos amounts table
        //scope: account_name
        TABLE locked_tlos {
            uint64_t locked_id;
            asset tlos_amount;
            time_point_sec locked_until_ts;

            
            auto primary_key()const { return locked_id; }

            EOSLIB_SERIALIZE(locked_tlos, (locked_id)(tlos_amount)(locked_until_ts));
        };
        typedef multi_index<name("lockedtlos"), locked_tlos> locked_tlos_table;

        //Blacklist of users
        TABLE userbl {
            name account;
            auto primary_key()const { return account.value; }
        };

        typedef eosio::multi_index<name("usersbl"), userbl> blacklist_users;
};
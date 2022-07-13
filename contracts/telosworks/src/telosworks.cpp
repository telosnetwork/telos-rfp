#include "../include/telosworks.hpp"

//======================== config actions ========================

void telosworks::init(name initial_admin)
{
    //authenticate
    require_auth(get_self());

    //open config singleton
    config_singleton configs(get_self(), get_self().value);

    //validate
    check(!configs.exists(), "contract already initialized");
    check(is_account(initial_admin), "initial admin account doesn't exist");

    //initialize
    config initial_conf;
    initial_conf.contract_version = "0.1.0";
    initial_conf.administrator = initial_admin;

    //set initial config
    configs.set(initial_conf, get_self());
}

void telosworks::setversion(string new_version)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    //change contract version
    conf.contract_version = new_version;

    //set new config
    configs.set(conf, get_self());
}

void telosworks::setadmin(name new_admin)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    //validate
    check(is_account(new_admin), "new admin account doesn't exist");

    //change admin
    conf.administrator = new_admin;

    //set new config
    configs.set(conf, get_self());
}

void telosworks::setlckdtime(uint32_t days)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    //validate
    check(days > 0, "Minimum Locked days must be greater than 0");

    //change locked days
    conf.tlos_locked_time = days;

    //set new config
    configs.set(conf, get_self());
}

void telosworks::setbonusperc(double bonus_percentage)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    //validate
    check(bonus_percentage >= 0.05 && bonus_percentage <= 0.1, "Bonus percentage must be between 5% y 10%");

    //change locked days
    conf.bonus_percentage = bonus_percentage;

    //set new config
    configs.set(conf, get_self());
}

void telosworks::setmilestone(uint32_t days)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    //validate
    check(days > 0, "Milestones must last at least 1 day");

    //change locked days
    conf.milestones_days = days;

    //set new config
    configs.set(conf, get_self());
}

void telosworks::addbuilddir(name director) {
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    check(is_account(director), "The user " + director.to_string() + " is not a TLOS account");

    auto build_director_itr = std::find(conf.build_directors.begin(), conf.build_directors.end(), director);

    check(build_director_itr == conf.build_directors.end(), "The user " + director.to_string() + " is already set as Build Director");

    conf.build_directors.push_back(director);
    configs.set(conf,get_self());

};

void telosworks::rmvbuilddir(name director) {
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    auto build_director_itr = std::find(conf.build_directors.begin(), conf.build_directors.end(), director);
    check(build_director_itr != conf.build_directors.end(), "The user " + director.to_string() + " is not set as Build Director");

    //open tables, get project
    projects_table projects(get_self(), get_self().value);

    auto director_idx = projects.get_index<name("bydirector")>();
    auto itr_start = director_idx.lower_bound(director.value);
    auto itr_end = director_idx.upper_bound(director.value);

    while( itr_start != itr_end ) {
        check(itr_start->status ==  project_status::drafting, "Can not remove a build director that has active projects");
        itr_start = director_idx.erase(itr_start);
    }

    conf.build_directors.erase(build_director_itr);
    configs.set(conf,get_self());
};


//======================== profile actions ========================

// void telosworks::addprofile(name account, string full_name, string country, string email, string company)
// {
//     //authenticate
//     require_auth(account);

//     //open profiles table, find profile
//     profiles_table profiles(get_self(), get_self().value);
//     auto prof_itr = profiles.find(account.value);

//     //validate
//     if(prof_itr == profiles.end()) {
//         //create new profile
//         //ram payer: profile owner
//         profiles.emplace(account, [&](auto& col) {
//             col.account = account;
//             col.full_name = full_name;
//             col.country = country;
//             col.email = email;
//             col.company = company;
//         });
//     } else {
//         profiles.modify(prof_itr, same_payer, [&](auto& col) {
//             col.full_name = full_name;
//             col.country = country;
//             col.email = email;
//             col.company = company;
//         });
//     }
// }


// void telosworks::rmvprofile(name account)
// {
//     //open config singleton, get config
//     config_singleton configs(get_self(), get_self().value);
//     auto conf = configs.get();

//     //open profiles table, find profile
//     profiles_table profiles(get_self(), get_self().value);
//     auto& prof = profiles.get(account.value, "profile not found");

//     //authenticate
//     check(has_auth(prof.account) || has_auth(conf.administrator), "requires authentication from profile account or admin account");

//     auto build_director_itr = std::find(conf.build_directors.begin(), conf.build_directors.end(), account);
//     check(build_director_itr == conf.build_directors.end(), "Can't delete a build director account, need to be removed from build director list first");

//     //erase profile
//     profiles.erase(prof);
// }



void telosworks::claimreward(name account, uint64_t locked_id) {

    //authenticate
    require_auth(account);

    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open profiles table
    profiles_table profiles(get_self(), get_self().value);
    auto& prof = profiles.get(account.value, "Profile not found");

    locked_tlos_table lockedtlos(get_self(), account.value);
    auto& locked_itr = lockedtlos.get(locked_id, "Locked tlos id not found");

    check(time_point_sec(current_time_point()) >= locked_itr.locked_until_ts, "TLOS is still locked");

    //update and set conf
    conf.reserved_funds -= locked_itr.tlos_amount;
    configs.set(conf, get_self());

    //update profiles balance
    profiles.modify(prof, same_payer, [&](auto& col) {
        col.tlos_balance -= locked_itr.tlos_amount;
    });

    //inline transfer
    action(permission_level{get_self(), name("active")}, name("eosio.token"), name("transfer"), make_tuple(
        get_self(), //from
        account, //to
        locked_itr.tlos_amount, //quantity
        std::string("Telos Works Withdrawal") //memo
    )).send();

    lockedtlos.erase(locked_itr);
}



//======================= Blacklist users =========================

void telosworks::adduserbl(name account) {
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    // profiles_table users(get_self(), get_self().value);
    // check(users.find(account.value) != users.end(), "account doesn't exist in the system");
    check(is_account(account), "account doesn't exist in the system");

    blacklist_users usersbl(get_self(), get_self().value);
    check(usersbl.find(account.value) == usersbl.end(), "This account is already in users blacklist");

    usersbl.emplace(get_self(), [&](auto& row) {
        row.account = account;
    });
};


void telosworks::rmvuserbl(name account) {
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    blacklist_users usersbl(get_self(), get_self().value);
    auto user = usersbl.find(account.value);
    check(user != usersbl.end(), "This account is not in users blacklist");

    usersbl.erase(user);
};

//======================= project actions =========================

void telosworks::draftproject(string title, name build_director, string description, string github_url, asset usd_rewarded,
    uint8_t number_proposals_rewarded, uint32_t proposing_days, uint32_t voting_days) {

    //open config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //Authenticate
    require_auth(build_director);
    auto build_director_itr = std::find(conf.build_directors.begin(), conf.build_directors.end(), build_director);
    check(build_director_itr != conf.build_directors.end(), "Only build directors can create projects");

    //validate
    check(title.length() <= MAX_TITLE_LEN, "title string is too long");
    check(description.length() <= MAX_DESCR_LEN, "description string is too long");
    check(usd_rewarded.symbol == USD_SYM && usd_rewarded.amount > 0, "asset has to be USD and greater than zero");
    check(number_proposals_rewarded > 0, "number_proposals_rewarded must be greater than zero");
    check(proposing_days > 0, "proposing days must be greater than zero");
    check(voting_days > 0, "voting days must be greater than zero");

    //open tables
    projects_table projects(get_self(), get_self().value);

    //initialize
    uint64_t new_project_id = projects.available_primary_key();


    //create new project
    projects.emplace(get_self(), [&](auto& col) {
        col.project_id = new_project_id;
        col.title = title;
        col.build_director = build_director;
        col.description = description;
        col.github_url = github_url;
        col.usd_rewarded = usd_rewarded;
        col.number_proposals_rewarded = number_proposals_rewarded;
        col.proposing_days = proposing_days;
        col.voting_days = voting_days;
        col.update_ts = time_point_sec(current_time_point());
    });
};

void telosworks::editproject(uint64_t project_id, optional<string> title, optional<string> description,
    optional<string> github_url, optional<asset> usd_rewarded, optional<uint8_t> number_proposals_rewarded,
    optional<uint32_t> proposing_days, optional<uint32_t> voting_days){

    //open config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open tables, get project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "project not found");

    //validate
    check(project.status == project_status::drafting,"project must be drafting to edit");


    //Authenticate
    require_auth(project.build_director);

    string new_title = project.title;
    if (title) {
        new_title = *title;
        check(new_title.length() <= MAX_TITLE_LEN, "title string is too long");
    }

    string new_desc = project.description;
    if (description) {
        new_desc = *description;
        check(new_desc.length() <= MAX_DESCR_LEN, "description string is too long");
    }

    string new_github_url = project.github_url;
    if (github_url) {
        new_github_url = *github_url;
    }

    asset new_usd_rewarded = project.usd_rewarded;
    if (usd_rewarded) {
        new_usd_rewarded = *usd_rewarded;
        check(usd_rewarded->symbol == USD_SYM && usd_rewarded->amount > 0, "asset has to be USD and greater than zero");
    }

    uint32_t new_number_proposals_rewarded = project.number_proposals_rewarded;
    if (number_proposals_rewarded) {
        new_number_proposals_rewarded = *number_proposals_rewarded;
        check(number_proposals_rewarded > 0, "number_proposals_rewarded must be greater than zero");
    }


    uint32_t new_proposing_days = project.proposing_days;
    if(proposing_days) {
        check(proposing_days > 0, "proposing days must be greater than zero");
        new_proposing_days = *proposing_days;
    }

    uint32_t new_voting_days = project.voting_days;
    if(voting_days) {
        check(voting_days > 0, "voting days must be greater than zero");
        new_voting_days = *voting_days;
    }

    //modify existant project
    projects.modify(project, same_payer, [&](auto& col) {
        col.title = new_title;
        col.description = new_desc;
        col.github_url = new_github_url;
        col.usd_rewarded = new_usd_rewarded;
        col.number_proposals_rewarded = new_number_proposals_rewarded;
        col.proposing_days = new_proposing_days;
        col.voting_days = new_voting_days;
        col.update_ts = time_point_sec(current_time_point());
    });

};

void telosworks::rmvproject(uint64_t project_id) {

    //open tables, get project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "project not found");

    //Authenticate
    require_auth(project.build_director);

    //validate
    check(project.status == project_status::drafting,"project must be drafting to delete");

    projects.erase(project);
}

void telosworks::publishprjct(uint64_t project_id) {

    //open tables, get project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "project not found");

    //Authenticate
    require_auth(project.build_director);

    check(project.status == project_status::drafting,"project must be drafting to publish it");

    //update project
    projects.modify(project, same_payer, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::published);
        col.propose_end_ts =  time_point_sec(current_time_point()) + project.proposing_days*86400;
        col.update_ts = time_point_sec(current_time_point());
    });
}

void telosworks::startproject(uint64_t project_id)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //authenticate
    require_auth(project.build_director);

    //validate
    check(project.status == project_status::voted, "Project status must be in voted status");

    auto tlosusd = tlosusdprice();
    auto tlos_locked = asset(2*(project.usd_rewarded.amount / tlosusd)*10000, TLOS_SYM);

    auto total_telos_rewarded = asset(project.number_proposals_rewarded*tlos_locked.amount, TLOS_SYM);
    check(conf.available_funds.amount >= total_telos_rewarded.amount, "Telos Works has insufficient available funds");

    //update config funds
    conf.available_funds -= total_telos_rewarded;
    conf.reserved_funds += total_telos_rewarded;
    configs.set(conf, get_self());

    //update project; rampayer=self because of inserting the string
    projects.modify(project, _self, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::started);
        col.update_ts = time_point_sec(current_time_point());
        col.start_ts = time_point_sec(current_time_point());
        col.tlos_locked = tlos_locked;
    });

    //open proposals table
    proposals_table proposals(get_self(), project_id);
    auto proposal = proposals.find(project.proposal_selected[0]);

    proposals.modify(proposal, _self, [&](auto& col){
        col.locked_tlos_amount = asset(2*(proposal->usd_amount.amount / tlosusd)*10000, TLOS_SYM);
    });

    //open profiles table
    profiles_table profiles(get_self(), get_self().value);

    for(auto i = 0; i < project.proposals_rewarded.size(); ++i) {
        auto proposal_rw = proposals.find(project.proposals_rewarded[i]);
        auto user_rewarded = proposal_rw->proposer;

        auto prof = profiles.find(user_rewarded.value);
        if(prof != profiles.end()) {
            profiles.modify(prof, get_self(), [&](auto& col) {
                col.tlos_balance += tlos_locked;
            });
        } else {
            profiles.emplace(get_self(), [&](auto& col) {
                col.account = user_rewarded;
                col.tlos_balance = tlos_locked;
            });
        }

        locked_tlos_table lockedtlos(get_self(), user_rewarded.value);

        uint64_t new_locked_id = lockedtlos.available_primary_key();

        lockedtlos.emplace(get_self(), [&](auto& col) {
            col.locked_id = new_locked_id;
            col.tlos_amount = tlos_locked;
            col.locked_until_ts =  time_point_sec(current_time_point()) + conf.tlos_locked_time*86400;
        });
    }

    auto start_time = time_point_sec(current_time_point());
    milestones_table milestones(get_self(), project_id);

    for(auto i = 0; i < proposal->number_milestones; ++i) {
        milestones.emplace(get_self(), [&](auto& col){
            col.milestone_id = i;
            col.tlos_rewarded = asset(0, TLOS_SYM);
            col.title = "";
            col.description = "";
            col.documents = "";
            col.start_ts = start_time;
            col.end_ts = start_time + conf.milestones_days*86400 - 1;
        });

        start_time += conf.milestones_days*86400;
    }

}

void telosworks::endproject(uint64_t project_id) {

    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //authenticate
    require_auth(project.build_director);

    //validate
    check(project.status == project_status::started, "Project must be in started status to be able to close it.");

    milestones_table milestones(get_self(), project_id);
    for( auto& milestone : milestones ) {
        check(milestone.status == milestone_status::reviewed, "All milestones needs to be reviewed to end the project");
    }

    projects.modify(project, _self, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::completed);
        col.update_ts = time_point_sec(current_time_point());
        col.end_ts = time_point_sec(current_time_point());
    });

}

//======================= proposal actions =========================

void telosworks::newproposal(uint64_t project_id, name proposer, uint64_t number_milestones, string timeline, string pdf, asset usd_amount,
string mockups_link, string kanban_board_link) {

    //open config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    // //open profiles table, find profile
    // profiles_table profiles(get_self(), get_self().value);
    // auto prof_itr = profiles.get(proposer.value, "Proposer is not in the system");
    check(is_account(proposer), "Proposer is not in the system");

    //open proposals table
    proposals_table proposals(get_self(), project_id);

    //Authenticate
    require_auth(proposer);

    //Check usd amount is valid
    check(usd_amount.symbol == USD_SYM && usd_amount.amount > 0, "asset has to be USD and greater than zero");
    check(number_milestones > 0, "At least proposal needs to have 1 milestone");
    check(proposer != project.build_director, "Build_director can't create a proposal for its own project");

    //Check proposing time is valid
    check(project.status == project_status::published, "Project must be published to accept proposals.");
    check(time_point_sec(current_time_point()) < project.propose_end_ts, "Proposing time has expired, cannot add new proposals.");

    //initialize
    uint64_t new_proposal_id = proposals.available_primary_key();

    //create new proposal
    proposals.emplace(get_self(), [&](auto& col) {
        col.proposal_id = new_proposal_id;
        col.proposer = proposer;
        col.number_milestones = number_milestones;
        col.timeline = timeline;
        col.pdf = pdf;
        col.usd_amount = usd_amount;
        col.mockups_link = mockups_link;
        col.kanban_board_link = kanban_board_link;
        col.update_ts = time_point_sec(current_time_point());
    });
};

void telosworks::editproposal(uint64_t project_id, uint64_t proposal_id, optional<string> timeline, optional<uint64_t> number_milestones,
    optional<string> pdf, optional<asset> usd_amount, optional<string> mockups_link, optional<string> kanban_board_link){
    //open config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //open proposals table
    proposals_table proposals(get_self(), project_id);
    auto& proposal = proposals.get(proposal_id, "Proposal not found");

    //Authenticate
    require_auth(proposal.proposer);

    //Check proposing time is valid
    check(project.status == project_status::published, "Project must be published to edit proposals.");
    check(time_point_sec(current_time_point()) < project.propose_end_ts, "Proposing time has expired, cannot edit proposals.");

    string new_timeline = proposal.timeline;
    if (timeline) {
        new_timeline = *timeline;
    }

    string new_pdf = proposal.pdf;
    if (pdf) {
        new_pdf = *pdf;
    }

    string new_mockups_link = proposal.mockups_link;
    if (mockups_link) {
        new_mockups_link = *mockups_link;
    }

    string new_kanban_board_link = proposal.kanban_board_link;
    if (kanban_board_link) {
        new_kanban_board_link = *kanban_board_link;
    }

    uint64_t new_number_milestones = proposal.number_milestones;
    if(number_milestones) {
        check(number_milestones > 0, "At least proposal needs to have 1 milestone");
        new_number_milestones = *number_milestones;
    }

    asset new_usd_amount = proposal.usd_amount;
    if (usd_amount) {
        new_usd_amount = *usd_amount;
        check(usd_amount->symbol == USD_SYM && usd_amount->amount > 0, "asset has to be USD and greater than zero");
    }

    proposals.modify(proposal, same_payer, [&](auto& col) {
        col.timeline = new_timeline;
        col.number_milestones = new_number_milestones;
        col.pdf = new_pdf;
        col.usd_amount = new_usd_amount;
        col.mockups_link = new_mockups_link;
        col.kanban_board_link = new_kanban_board_link;
        col.update_ts = time_point_sec(current_time_point());
    });

};

void telosworks::rmvproposal(uint64_t project_id, uint64_t proposal_id){
    //open config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //open proposals table
    proposals_table proposals(get_self(), project_id);
    auto& proposal = proposals.get(proposal_id, "Proposal not found");

    //Authenticate
    check(has_auth(proposal.proposer) || has_auth(conf.administrator), "Missing authority");

    //Check proposing time is in published state
    check(project.status == project_status::published, "Project must be in published state to erase a proposal.");

    proposals.erase(proposal);

};

//========================= voting actions ============================

void telosworks::skipvoting(uint64_t project_id, uint64_t proposal_selected, vector<uint64_t> proposals_rewarded)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //open proposals table
    proposals_table proposals(get_self(), project_id);

    require_auth(project.build_director);

    check(project.status == project_status::published, "Project must be published to skip voting.");
    check(time_point_sec(current_time_point()) > project.propose_end_ts, "Can't select proposal until proposing time has ended");

    //Check that proposals selected and proposals rewarded are valid
    auto proposal = proposals.find(proposal_selected);
    check(proposal != proposals.end(), "Proposal selected not found");
    for(auto i = 0; i < proposals_rewarded.size(); ++i) {
        check(proposals.find(proposals_rewarded[i]) != proposals.end(), "Proposal rewarded " + to_string(proposals_rewarded[i]) + " not found");
    }
    check(proposals_rewarded.size() == project.number_proposals_rewarded,
        "Proposals rewarded size must much with the number of proposals rewarded");
    check(std::find(proposals_rewarded.begin(), proposals_rewarded.end(), proposal_selected) != proposals_rewarded.end(),
        "Proposal selected must be included in proposals_rewarded");


    //update project; rampayer=self because of inserting the string
    projects.modify(project, _self, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::selected);
        col.proposals_rewarded = proposals_rewarded;
        col.proposal_selected = vector<uint64_t>{proposal_selected};
        col.update_ts = time_point_sec(current_time_point());
    });
}

void telosworks::beginvoting(uint64_t project_id, name ballot_name)
{
    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //authenticate
    require_auth(project.build_director);

    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //initialize
    time_point_sec now = time_point_sec(current_time_point());
    time_point_sec ballot_end_time = now + project.voting_days*86400;


    //open proposals table
    proposals_table proposals(get_self(), project_id);

    //Get ballot options
    vector<name> ballot_options = {};
    for( auto& proposal : proposals) {
        ballot_options.push_back(name(proposal.proposal_id));
    }

    //validate
    check(project.status == project_status::published, "Project must be in published status");
    check(time_point_sec(current_time_point()) > project.propose_end_ts, "Can't start voting process until proposing time has ended.");

    telosdecide::config_singleton configdecide(TELOSDECIDE, TELOSDECIDE.value);
    auto confdecide = configdecide.get();
    asset newballot_fee = confdecide.fees.at(name("ballot"));
    check(conf.available_funds.amount >= newballot_fee.amount, "Telos Works has insufficient available funds");


    //update project
    projects.modify(project, same_payer, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::voting);
        col.ballot_name = ballot_name;
        col.update_ts = time_point_sec(current_time_point());
        col.vote_end_ts = ballot_end_time;
    });

    //update and set config
    conf.available_funds -= newballot_fee;
    configs.set(conf, get_self());

    //send inline transfer to pay for newballot fee
    action(permission_level{get_self(), name("active")}, name("eosio.token"), name("transfer"), make_tuple(
        get_self(), //from
        TELOSDECIDE, //to
        newballot_fee, //quantity
        string("Decide New Ballot Fee Payment") //memo
    )).send();

    //send inline newballot to decide
    action(permission_level{get_self(), name("active")}, TELOSDECIDE, name("newballot"), make_tuple(
        ballot_name, //ballot_name
        name("leaderboard"), //category
        get_self(), //publisher
        VOTE_SYM, //treasury_symbol
        name("1token1vote"), //voting_method
        ballot_options //initial_options
    )).send();

    // //send inline editdetails to decide
    // action(permission_level{get_self(), name("active")}, TELOSDECIDE, name("editdetails"), make_tuple(
    //     ballot_name, //ballot_name
    //     project.title, //title
    //     project.description, //description
    //     "" //content
    // )).send();

    //toggle ballot votestake on (default is off)
    action(permission_level{get_self(), name("active")}, TELOSDECIDE, name("togglebal"), make_tuple(
        ballot_name, //ballot_name
        name("votestake") //setting_name
    )).send();



    //send inline openvoting to decide
    action(permission_level{get_self(), name("active")}, TELOSDECIDE, name("openvoting"), make_tuple(
        ballot_name, //ballot_name
        ballot_end_time //end_time
    )).send();
}

void telosworks::endvoting(uint64_t project_id)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //authenticate
    check(has_auth(project.build_director) || has_auth(conf.administrator), "requires build_director or admin to authenticate");

    //validate
    check(project.status == project_status::voting, "Project status must be in voting state");
    check(time_point_sec(current_time_point()) > project.vote_end_ts, "Vote time has not ended");

    //send inline closevoting to decide
    action(permission_level{get_self(), name("active")}, TELOSDECIDE, name("closevoting"), make_tuple(
        project.ballot_name, //ballot_name
        true //broadcast
    )).send();

    //NOTE: results processed in catch_broadcast()

}


void telosworks::pickproposal(uint64_t project_id, uint64_t proposal_id)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //authenticate
    require_auth(project.build_director);

    //validate
    check(project.status == project_status::voted, "Project must be in voted status");
    check(std::find(project.proposals_rewarded.begin(), project.proposals_rewarded.end(), proposal_id)
        != project.proposals_rewarded.end(), "Proposal selected must be one of the proposals rewarded");


    //update project; rampayer=self because of inserting the string
    projects.modify(project, _self, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::selected);
        col.proposal_selected = vector<uint64_t>{proposal_id};
        col.update_ts = time_point_sec(current_time_point());
    });
}

//========================== milestones actions =========================

void telosworks::sendreport(uint64_t project_id, uint64_t milestone_id, string title, string description, string documents) {

    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    check(project.status == project_status::started, "Project is not in started status, cannot update milestones");

    //open proposals table
    proposals_table proposals(get_self(), project_id);
    auto proposal = proposals.find(project.proposal_selected[0]);

    require_auth(proposal->proposer);

    //open milestones table
    milestones_table milestones(get_self(), project_id);
    auto& milestone = milestones.get(milestone_id, "Milestone not found");

    auto now = time_point_sec(current_time_point());

    check(milestone.status == milestone_status::pending, "A report has already been sent.");
    check(now >= milestone.start_ts, "Cannot send a report before the milestone starts");

    milestones.modify(milestone, get_self(), [&](auto& col) {
        col.status =  static_cast<uint8_t>(milestone_status::sent);
        col.send_ts = now;
        col.title = title;
        col.description = description;
        col.documents = documents;
    });
}

void telosworks::reviewreport(uint64_t project_id, uint64_t milestone_id, bool pay_reward, bool bonus) {

    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //open proposals table
    proposals_table proposals(get_self(), project_id);
    auto proposal = proposals.find(project.proposal_selected[0]);

    require_auth(project.build_director);

    check(project.status == project_status::started, "Project is not in started status, cannot review milestones");

    //open milestones table
    milestones_table milestones(get_self(), project_id);
    auto& milestone = milestones.get(milestone_id, "Milestone not found");

    auto now = time_point_sec(current_time_point());

    check(milestone.status == milestone_status::sent, "Milestone must be in sent status to review it");
    check(now >= milestone.end_ts, "Cannot review a milestone before it has finished its time");
    check((pay_reward && milestone.send_ts >= milestone.start_ts
    && milestone.send_ts < milestone.end_ts) || !pay_reward, "Can only pay reward if milestone is sent on time.");
    check((bonus && milestone.send_ts >= milestone.start_ts
    && milestone.send_ts < milestone.end_ts) || !bonus, "Can only pay bonus if milestone is sent on time.");
    check(!bonus || (pay_reward && bonus), "Cannot pay bonus and not paying default");


    auto tlos_rewarded = asset(0, TLOS_SYM);

    if(pay_reward) {
        tlos_rewarded += asset(proposal->locked_tlos_amount.amount*conf.reward_percentage, TLOS_SYM);
    }

    if(bonus) {
        tlos_rewarded += asset(proposal->locked_tlos_amount.amount*conf.bonus_percentage, TLOS_SYM);
    }

    check(conf.available_funds.amount >= tlos_rewarded.amount, "Telos Works has insufficient available funds");

    //update config funds
    conf.available_funds -= tlos_rewarded;
    conf.reserved_funds += tlos_rewarded;
    configs.set(conf, get_self());

    milestones.modify(milestone, get_self(), [&](auto& col) {
        col.status =  static_cast<uint8_t>(milestone_status::reviewed);
        col.review_ts = now;
        col.tlos_rewarded = tlos_rewarded;
    });


    //open profiles table
    profiles_table profiles(get_self(), get_self().value);
    auto prof = profiles.find(proposal->proposer.value);
    if(prof != profiles.end()) {
        profiles.modify(prof, get_self(), [&](auto& col) {
            col.tlos_balance += tlos_rewarded;
        });
    } else {
        profiles.emplace(get_self(), [&](auto& col) {
            col.account = proposal->proposer;
            col.tlos_balance = tlos_rewarded;
        });
    }


    locked_tlos_table lockedtlos(get_self(), proposal->proposer.value);

    uint64_t new_locked_id = lockedtlos.available_primary_key();

    lockedtlos.emplace(get_self(), [&](auto& col) {
        col.locked_id = new_locked_id;
        col.tlos_amount = tlos_rewarded;
        col.locked_until_ts =  time_point_sec(current_time_point()) + conf.tlos_locked_time*86400;
    });
}


//======================== notification handlers ========================

void telosworks::catch_transfer(name from, name to, asset quantity, string memo)
{
    //get initial receiver contract
    name rec = get_first_receiver();

    //if notification from eosio.token, transfer to self, and TLOS symbol
    if (rec == name("eosio.token") && to == get_self() && quantity.symbol == TLOS_SYM) {
        //skips emplacement if memo is skip
        if (memo == std::string("skip")) {
            return;
        }

        //open config singleton, get config
        config_singleton configs(get_self(), get_self().value);
        auto conf = configs.get();

        //adds to available funds
        conf.available_funds += quantity;
        configs.set(conf, get_self());
    }
}

void telosworks::catch_broadcast(name ballot_name, map<name, asset> final_results, uint32_t total_voters)
{
    //get initial receiver contract
    name rec = get_first_receiver();

    //if notification not from decide account
    if (rec != TELOSDECIDE) {
        return;
    }

    //open proposals table, get by ballot index, find proposal
    projects_table projects(get_self(), get_self().value);
    auto projects_by_ballot = projects.get_index<name("byballot")>();
    auto by_ballot_itr = projects_by_ballot.lower_bound(ballot_name.value);

    //if proposal found
    if (by_ballot_itr != projects_by_ballot.end()) {

        //open config singleton, get config
        config_singleton configs(get_self(), get_self().value);
        auto conf = configs.get();

        //open telos decide treasury table, get treasury
        telosdecide::treasuries_table treasuries(TELOSDECIDE, TELOSDECIDE.value);
        auto& trs = treasuries.get(VOTE_SYM.code().raw(), "Treasury not found");

        //validate
        check(by_ballot_itr->status == project_status::voting, "Project must be in voting state to end voting");

        //get proposals selected and rewarded
        vector<pair<name, asset>> pairs;
        for (auto itr = final_results.begin(); itr != final_results.end(); ++itr)
            pairs.push_back(*itr);

        sort(pairs.begin(), pairs.end(), [=](pair<name, asset>& a, std::pair<name, asset>& b)
        {
            return a.second.amount > b.second.amount;
        });

        vector<uint64_t> proposals_rewarded = vector<uint64_t>{};
        auto num_proposals_rewarded =  pairs.size() <= by_ballot_itr->number_proposals_rewarded
            ? pairs.size()
            : by_ballot_itr->number_proposals_rewarded;

        for(auto i = 0; i < num_proposals_rewarded; ++i) {
            proposals_rewarded.push_back(pairs[i].first.value);
        }

        projects.modify(*by_ballot_itr, _self, [&](auto& col) {
            col.status = static_cast<uint8_t>(project_status::voted);
            col.proposals_rewarded = proposals_rewarded;
            col.update_ts = time_point_sec(current_time_point());
        });
    }
}

//======================== functions ========================

uint64_t telosworks::tlosusdprice() {
  delphioracle::datapoints_table _datapoints(name("delphioracle"), name("tlosusd").value);
  auto itr = _datapoints.find(1);
  return itr -> median;
}

//======================= wipe actions ====================


// void telosworks::wipeconf()
// {
//     config_singleton configs(get_self(), get_self().value);
//     configs.remove();
// }

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

    int64_t primary_key() const { return name("config").value; };

    EOSLIB_SERIALIZE(config, (contract_version)(administrator)
    (available_funds)(reserved_funds)(build_directors)
    (reward_percentage)(bonus_percentage)(milestones_days)(tlos_locked_time))

};

typedef singleton<name("config"), config> config_singleton;
typedef multi_index<name("config"), config>config_for_abi;

HYDRA_FIXTURE_ACTION(
    ((profiles)(profile)(profiles_table))
    ((projects)(project)(projects_table))
    ((proposals)(proposal)(proposals_table))
    ((milestones)(milestone)(milestones_table))
    ((lockedtlos)(locked_tlos)(locked_tlos_table))
    ((usersbl)(userbl)(blacklist_users))
    ((config)(config)(config_for_abi)) //Convert singleton into multi_index table
)


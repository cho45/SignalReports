Sequel.migration do
	up do
		alter_table :entries do
			add_column :age, Integer
			add_column :antenna, String
			add_column :rig, String
			add_column :tx_power, String
			add_column :location, String # logging stations's location
		end
	end

	down do
		alter_table :entries do
			drop_column :age
			drop_column :antenna
			drop_column :rig
			drop_column :tx_power
			drop_column :location
		end
	end
end



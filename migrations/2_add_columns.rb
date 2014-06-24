Sequel.migration do
	up do
		alter_table :entries do
			add_column :antenna, String
			add_column :tx_power, String
		end
	end

	down do
		alter_table :entries do
			drop_column :antenna
			drop_column :tx_power
		end
	end
end



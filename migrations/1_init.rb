Sequel.migration do
	up do
		create_table :entries do
			primary_key :id
			String :callsign
			Float :frequency
			String :mode
			Integer :datetime
			String :ur_rst
			String :my_rst
			String :name
			String :address
			String :memo

			index :callsign
			index :frequency
			index :mode
			index :datetime
		end
	end

	down do
		drop_table(:entries)
	end
end

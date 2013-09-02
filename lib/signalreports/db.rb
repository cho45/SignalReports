require 'sqlite3'
require 'sequel'

class SignalReports
	DB = Sequel.connect(settings.db)
	DB.create_table :entries do
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
	end unless DB.table_exists?(:entries)

	class Entry < Sequel::Model
		plugin :force_encoding, 'UTF-8'

		def to_stash
			{
				"id"        => self.id,
				"callsign"  => self.callsign,
				"frequency" => self.frequency,
				"mode"      => self.mode,
				"datetime"  => self.datetime,
				"ur_rst"    => self.ur_rst,
				"my_rst"    => self.my_rst,
				"name"      => self.name,
				"address"   => self.address,
				"memo"      => self.memo,
			}
		end
	end
end

require 'sqlite3'
require 'sequel'
Sequel.extension :migration

class SignalReports
	DB = Sequel.connect(settings.db)
	Sequel::Migrator.run(DB, 'migrations', :use_transactions => true)

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

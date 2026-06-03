package resource.backend.common.type;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.usertype.UserType;

import java.io.Serializable;
import java.sql.*;

public class PostgreSQLEnumType<T extends Enum<T>> implements UserType<T> {

    private final Class<T> enumClass;

    public PostgreSQLEnumType(Class<T> enumClass) {
        this.enumClass = enumClass;
    }

    @Override
    public int getSqlType() {
        return Types.OTHER;
    }

    @Override
    public Class<T> returnedClass() {
        return enumClass;
    }

    @Override
    public boolean equals(T x, T y) { return x == y; }

    @Override
    public int hashCode(T x) { return x == null ? 0 : x.hashCode(); }

    @Override
    public T nullSafeGet(ResultSet rs, int position,
                         SharedSessionContractImplementor session, Object owner) throws SQLException {
        String value = rs.getString(position);
        if (value == null) return null;
        return Enum.valueOf(enumClass, value.toUpperCase());
    }

    @Override
    public void nullSafeSet(PreparedStatement st, T value, int index,
                            SharedSessionContractImplementor session) throws SQLException {
        if (value == null) {
            st.setNull(index, Types.OTHER);
        } else {
            st.setObject(index, value.name().toLowerCase(), Types.OTHER);
        }
    }

    @Override
    public T deepCopy(T value) { return value; }

    @Override
    public boolean isMutable() { return false; }

    @Override
    public Serializable disassemble(T value) { return (Serializable) value; }

    @Override
    @SuppressWarnings("unchecked")
    public T assemble(Serializable cached, Object owner) { return (T) cached; }
}